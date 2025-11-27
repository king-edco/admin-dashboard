import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { Pay } from "@nkwa-pay/sdk";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURATION ---
const NKWA_API_KEY = process.env.NKWA_API_KEY || "YOUR_SANDBOX_KEY"; 
const NKWA_ENV = process.env.NKWA_ENV || "sandbox"; 

// Initialize SDK
const pay = new Pay({
  apiKeyAuth: NKWA_API_KEY,
  serverURL: NKWA_ENV === "production" 
    ? "https://api.pay.mynkwa.com" 
    : "https://api.pay.staging.mynkwa.com",
});

// --- 1. ADMIN MAKER ---
export const addAdminRole = onCall(async (request) => {
  const SUPER_ADMIN_EMAIL = "logamaxime@gmail.com"; 
  const requesterEmail = request.auth?.token.email;
  const isAlreadyAdmin = request.auth?.token.admin === true;

  if (!isAlreadyAdmin && requesterEmail !== SUPER_ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Only admins can add other admins.");
  }

  const { email } = request.data; 

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    await db.collection("adminLogs").add({
      action: "ADD_ADMIN",
      targetEmail: email,
      actor: requesterEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { message: `Success! ${email} is now an Admin.` };
  } catch (error) {
    logger.error("Error adding admin", error);
    throw new HttpsError("not-found", `User ${email} not found.`);
  }
});

// --- 2. SECURE DOWNLOADS ---
export const getSecureDownloadUrl = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please log in.");

  if (request.auth.token.admin !== true) {
     const userDoc = await db.collection("users").doc(request.auth.uid).get();
     const userData = userDoc.data();
     if (userData?.subscriptionStatus !== 'active' && userData?.subscriptionStatus !== 'trial') {
        throw new HttpsError("permission-denied", "Subscription required.");
     }
  }

  const { filePath } = request.data;
  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60, 
  });

  return { url };
});

// --- 3. MATRICULE UNIQUENESS ---
export const enforceMatriculeUniqueness = onDocumentCreated("users/{userId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const newUser = snapshot.data();
    const { matricule, facultyId } = newUser;

    const duplicates = await db.collection("users")
      .where("facultyId", "==", facultyId)
      .where("matricule", "==", matricule)
      .get();

    if (duplicates.size > 1) {
      await snapshot.ref.delete();
      logger.warn(`Fraud detected: Duplicate matricule ${matricule} deleted.`);
    }
});

// --- 4. BROADCAST NOTIFICATIONS ---
export const sendBroadcast = onCall(async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError("permission-denied", "Admins only.");
  }

  const { title, body, targetLevel, targetFacultyId } = request.data;

  let userQuery = db.collection("users").where("fcmToken", "!=", ""); 

  if (targetFacultyId && targetFacultyId !== "ALL") {
    userQuery = userQuery.where("facultyId", "==", targetFacultyId);
  }
  if (targetLevel && targetLevel !== "ALL") {
    userQuery = userQuery.where("level", "==", targetLevel);
  }

  const snapshot = await userQuery.get();
  
  if (snapshot.empty) {
    return { success: true, count: 0, message: "No matching users found." };
  }

  const tokens: string[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fcmToken) tokens.push(data.fcmToken);
  });

  if (tokens.length > 0) {
    const message = {
      notification: { title, body },
      tokens: tokens,
    };
    
    const response = await admin.messaging().sendEachForMulticast(message);
    
    await db.collection("adminLogs").add({
      action: "BROADCAST_SENT",
      title,
      targetLevel: targetLevel || "ALL",
      recipientCount: response.successCount,
      adminEmail: request.auth.token.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, count: response.successCount };
  }

  return { success: true, count: 0 };
});

// --- 5. INITIATE SUBSCRIPTION ---
export const initiateSubscription = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const { phoneNumber } = request.data;
  const userId = request.auth.uid;
  const amount = 399; 

  try {
    const txRef = db.collection("transactions").doc();
    await txRef.set({
      userId,
      amount,
      currency: "XAF",
      status: "PENDING",
      type: "SUBSCRIPTION",
      phoneNumber,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Fix: Validated against Nkwa SDK docs
    const response = await (pay as any).collect.post({
      requestBody: {
        amount: amount,
        phoneNumber: phoneNumber, 
        description: `Subscription for user ${userId}`,
      }
    });

    await txRef.update({
      nkwaPaymentId: response.payment.id
    });

    return { success: true, message: "Payment initiated.", paymentId: response.payment.id };

  } catch (error: any) {
    logger.error("Payment Init Error", error);
    throw new HttpsError("internal", "Failed to initiate payment.", error.message);
  }
});

// --- 6. SECURE WEBHOOK HANDLER ---
export const nkwaWebhook = onRequest(async (req, res) => {
  const NKWA_PUBLIC_KEY = process.env.NKWA_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
  YOUR_PUBLIC_KEY_CONTENT_HERE_KEEP_NEWLINES
  -----END PUBLIC KEY-----`;
  
  const REGISTERED_WEBHOOK_URL = process.env.NKWA_WEBHOOK_URL || "https://us-central1-your-project.cloudfunctions.net/nkwaWebhook";

  const signature = req.headers["x-signature"] as string;
  const timestamp = req.headers["x-timestamp"] as string;

  if (!signature || !timestamp) {
    logger.warn("Webhook missing security headers");
    res.status(400).send("Missing Headers");
    return;
  }

  try {
    const payload = timestamp + REGISTERED_WEBHOOK_URL + JSON.stringify(req.body);

    const isVerified = crypto.verify(
      "sha256",
      Buffer.from(payload),
      {
        key: NKWA_PUBLIC_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(signature, "base64")
    );

    if (!isVerified) {
      logger.error("Webhook Signature Verification FAILED.");
      res.status(401).send("Invalid Signature");
      return;
    }
  } catch (err) {
    logger.error("Crypto verification error", err);
    res.status(500).send("Verification Error");
    return;
  }

  const event = req.body;
  const { status, id } = event; 

  try {
    const txSnapshot = await db.collection("transactions").where("nkwaPaymentId", "==", id).limit(1).get();
    
    if (txSnapshot.empty) {
      logger.warn(`Transaction not found for Nkwa ID: ${id}`);
      res.status(200).send("Transaction not found");
      return;
    }

    const txDoc = txSnapshot.docs[0];
    const txData = txDoc.data();

    if (status === "SUCCESSFUL" && txData.status !== "SUCCESSFUL") {
      
      await txDoc.ref.update({ 
        status: "SUCCESSFUL", 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(now.getDate() + 30); 

      await db.collection("users").doc(txData.userId).update({
        subscriptionStatus: "active",
        lastPaymentDate: now.toISOString(),
        subscriptionExpiryDate: expiryDate.toISOString(),
      });

      try {
        const userDoc = await db.collection("users").doc(txData.userId).get();
        const userData = userDoc.data();
        if (userData && userData.fcmToken) {
          await admin.messaging().send({
            token: userData.fcmToken,
            notification: {
              title: "Payment Confirmed! ✅",
              body: "Your subscription is now active.",
            }
          });
        }
      } catch (e) {
        logger.error("Push notification failed", e);
      }
      
      logger.info(`Subscription activated for user ${txData.userId}`);

    } else if (status === "FAILED") {
      await txDoc.ref.update({ status: "FAILED" });
    }

    res.status(200).send("Processed");

  } catch (error) {
    logger.error("Webhook Logic Error", error);
    res.status(500).send("Internal Server Error");
  }
});