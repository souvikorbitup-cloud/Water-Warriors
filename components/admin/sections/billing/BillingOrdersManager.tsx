"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/admin/shared/Pagination";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import SubmissionsFilter, {
  type FilterOption,
} from "@/components/admin/shared/filters/SubmissionsFilter";
import { Modal } from "@/components/admin/shared/modal";
import SubmissionsTableSkeleton from "@/components/admin/sections/submissions/SubmissionsTableSkeleton";
import { useSubmissionsList } from "@/lib/hooks/use-submissions-list";
import type {
  BillingOrderListItem,
  BillingOrderListResponse,
} from "@/lib/billing/types";

const STATUS_OPTIONS: FilterOption[] = [
  { value: "created", label: "Created" },
  { value: "paid", label: "Paid" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "amountPaise:desc", label: "Amount high to low" },
  { value: "amountPaise:asc", label: "Amount low to high" },
  { value: "status:asc", label: "Status A-Z" },
  { value: "status:desc", label: "Status Z-A" },
];

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMATTER.format(date);
}

function formatAmount(amountPaise: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amountPaise / 100);
}

export default function BillingOrdersManager({
  initialData,
}: {
  initialData: BillingOrderListResponse;
}) {
  const { params, data, loading, error, updateParams, refresh } =
    useSubmissionsList<BillingOrderListItem>(
      "/api/admin/billing/orders",
      initialData,
    );
  const [selectedOrder, setSelectedOrder] =
    useState<BillingOrderListItem | null>(null);

  const empty = !loading && !error && (data?.items.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Orders Billings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review payment orders, customer details, and rooftop selections.
        </p>
      </div>

      <SubmissionsFilter
        search={params.search}
        searchPlaceholder="Order ID, customer, payment or coupon"
        onSearchChange={(search) => updateParams({ search })}
        status={params.status}
        statusOptions={STATUS_OPTIONS}
        onStatusChange={(status) => updateParams({ status })}
        sort={params.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(sort) => updateParams({ sort })}
        onReset={() =>
          updateParams({
            search: "",
            status: "",
            sort: "createdAt:desc",
            page: 1,
          })
        }
      />

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p>{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <SubmissionsTableSkeleton columns={6} />
      ) : error ? null : empty ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
          <p className="text-base font-medium text-heading">
            No billing orders yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed and pending payment orders will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Order / Customer</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Coupon</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.items ?? []).map((order) => (
                  <tr key={order.id} className="bg-white hover:bg-gray-50/70">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-heading">
                        {order.orderId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customerName || "No customer name"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap font-medium text-heading">
                      {formatAmount(order.amountPaise, order.currency)}
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {order.couponCode || "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        className="cursor-pointer"
                      >
                        <Eye className="size-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={data?.page ?? 1}
            totalPages={data?.totalPages ?? 1}
            onPageChange={(page) => updateParams({ page })}
          />
        </>
      )}

      <Modal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        className="max-w-3xl p-5 sm:p-8"
      >
        {selectedOrder && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-order-detail-title"
            className="max-h-[85dvh] overflow-y-auto"
          >
            <h2
              id="billing-order-detail-title"
              className="pr-12 text-xl font-semibold text-heading"
            >
              Billing order details
            </h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail label="Record ID" value={selectedOrder.id} />
              <Detail label="Order ID" value={selectedOrder.orderId} />
              <Detail
                label="Status"
                value={selectedOrder.status === "paid" ? "Paid" : "Created"}
              />
              <Detail
                label="Amount"
                value={formatAmount(
                  selectedOrder.amountPaise,
                  selectedOrder.currency,
                )}
              />
              <Detail label="Currency" value={selectedOrder.currency} />
              <Detail
                label="Customer"
                value={selectedOrder.customerName || "—"}
              />
              <Detail label="Coupon" value={selectedOrder.couponCode || "—"} />
              <Detail
                label="Payment ID"
                value={selectedOrder.paymentId || "—"}
              />
              <Detail
                label="Created"
                value={formatDate(selectedOrder.createdAt)}
              />
              <Detail label="Paid" value={formatDate(selectedOrder.paidAt)} />
              <Detail
                label="Rooftop name"
                value={selectedOrder.rooftopSelection?.name || "—"}
              />
              <Detail
                label="Map zoom"
                value={
                  selectedOrder.rooftopSelection
                    ? String(selectedOrder.rooftopSelection.zoom)
                    : "—"
                }
              />
            </dl>

            {selectedOrder.rooftopSelection && (
              <section className="mt-6">
                <h3 className="font-semibold text-heading">Rooftop points</h3>
                <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-gray-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Point</th>
                        <th className="px-3 py-2 font-medium">Latitude</th>
                        <th className="px-3 py-2 font-medium">Longitude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.rooftopSelection.points.map(
                        ({ lat, lng }, index) => (
                          <tr key={`${lat}-${lng}-${index}`}>
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">{lat}</td>
                            <td className="px-3 py-2">{lng}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm text-heading">{value}</dd>
    </div>
  );
}
