"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/api/client";
import type { AdminUserDetail, AdminUserSummary, PaginationMeta, UserRole, UserStatus } from "@/lib/api/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function AdminUsersPage() {
  const auth = useRequireAuth({ adminOnly: true });
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (page = 1) => {
    if (!auth.accessToken) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getUsers(auth.accessToken, {
        page,
        limit: 12,
        search: search || undefined,
        role: roleFilter || undefined
      });
      setUsers(response.data);
      setMeta(response.meta);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Could not load users"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.accessToken) {
      return;
    }
    void fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.accessToken, roleFilter]);

  const updateRole = async (userId: string, role: UserRole) => {
    if (!auth.accessToken) {
      return;
    }
    setBusyUserId(userId);
    setError(null);
    try {
      await adminApi.updateUserRole(auth.accessToken, userId, role);
      await fetchUsers(meta?.page || 1);
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Could not update role"));
    } finally {
      setBusyUserId(null);
    }
  };

  const updateStatus = async (userId: string, status: UserStatus) => {
    if (!auth.accessToken) {
      return;
    }
    setBusyUserId(userId);
    setError(null);
    try {
      await adminApi.updateUserStatus(auth.accessToken, userId, status);
      await fetchUsers(meta?.page || 1);
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Could not update status"));
    } finally {
      setBusyUserId(null);
    }
  };

  const showUserDetail = async (userId: string) => {
    if (!auth.accessToken) {
      return;
    }
    try {
      const response = await adminApi.getUserById(auth.accessToken, userId);
      setSelectedUser(response);
    } catch (detailError) {
      setError(getErrorMessage(detailError, "Could not load user detail"));
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Admin"
        title="Users Management"
        description="Review account activity and update status/roles."
      />

      <Card className="flex flex-col gap-2 md:flex-row">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="w-full md:w-52">
          <Select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as UserRole | "")}
          >
            <option value="">All roles</option>
            <option value="customer">customer</option>
            <option value="admin">admin</option>
          </Select>
        </div>
        <Button variant="ghost" onClick={() => void fetchUsers(1)}>
          Apply
        </Button>
      </Card>

      {error ? <Card className="border-rose-200 bg-rose-50 py-3 text-sm text-rose-700">{error}</Card> : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate">No users found.</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-2 rounded-xl border border-slate/20 bg-cloud p-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-semibold text-ink">{user.fullName}</p>
                  <p className="text-xs text-slate">{user.email}</p>
                  <p className="text-xs text-slate">
                    Orders: {user.orderCount} | Spent: {formatCurrency(user.totalSpent)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    className="w-32"
                    defaultValue={user.role}
                    disabled={busyUserId === user.id}
                    onChange={(event) => void updateRole(user.id, event.target.value as UserRole)}
                  >
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </Select>
                  <Select
                    className="w-32"
                    defaultValue={user.status}
                    disabled={busyUserId === user.id}
                    onChange={(event) => void updateStatus(user.id, event.target.value as UserStatus)}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => void showUserDetail(user.id)}>
                    Detail
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">User Detail</p>
          {selectedUser ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-ink">{selectedUser.fullName}</p>
              <p className="text-slate">{selectedUser.email}</p>
              <p className="text-slate">Phone: {selectedUser.phone || "N/A"}</p>
              <p className="text-slate">
                Joined: <span className="text-ink">{formatDate(selectedUser.createdAt)}</span>
              </p>
              <div className="rounded-xl border border-slate/20 bg-cloud p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">Order history</p>
                <p className="text-slate">Total orders: {selectedUser.orderHistory.totalOrders}</p>
                <p className="text-slate">
                  Total spent: {formatCurrency(selectedUser.orderHistory.totalSpent)}
                </p>
                <p className="text-slate">
                  Completed revenue: {formatCurrency(selectedUser.orderHistory.completedRevenue)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate">Choose a user to see details.</p>
          )}
        </Card>
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-xl2 border border-slate/20 bg-cloud p-3">
          <Button variant="ghost" disabled={meta.page <= 1} onClick={() => void fetchUsers(meta.page - 1)}>
            Previous
          </Button>
          <p className="text-sm font-semibold text-slate">
            Page {meta.page} / {meta.totalPages}
          </p>
          <Button
            variant="ghost"
            disabled={meta.page >= meta.totalPages}
            onClick={() => void fetchUsers(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
