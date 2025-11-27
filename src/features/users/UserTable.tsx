import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserProfile } from "@/types/schema";
import { Mail, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface UserTableProps {
  users: UserProfile[];
  isLoading: boolean;
}

export const UserTable = ({ users, isLoading }: UserTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-bold w-fit">
            <CheckCircle size={12} /> Active
          </span>
        );
      case "trial":
        return (
          <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-1 rounded-full text-xs font-bold w-fit">
            <Clock size={12} /> Trial
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-bold w-fit">
            <AlertCircle size={12} /> Expired
          </span>
        );
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Matricule</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">{user.fullName}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Mail size={12} /> {user.email}
                </div>
              </TableCell>
              <TableCell className="font-mono text-blue-600">
                {user.matricule}
              </TableCell>
              <TableCell>
                <div className="text-sm">{user.level}</div>
              </TableCell>
              <TableCell>{getStatusBadge(user.subscriptionStatus)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
