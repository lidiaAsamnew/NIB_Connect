import { useEffect, useMemo, useState } from "react";
import { Ticket } from "lucide-react";
import AccessRestricted from "../../components/AccessRestricted";
import PageHeader from "../../components/beneficiary/PageHeader";
import Toast from "../../components/beneficiary/Toast";
import VoucherCard from "../../components/beneficiary/VoucherCard";
import VoucherRules from "../../components/beneficiary/VoucherRules";
import VoucherSummary from "../../components/beneficiary/VoucherSummary";
import { EmptyVouchers, ModuleError, VoucherSkeleton } from "../../components/beneficiary/ModuleState";
import useBeneficiaryResource from "../../hooks/useBeneficiaryResource";
import { getMyVouchers } from "../../services/voucherService.js";
import { VOUCHER_STATUSES, formatVoucherAmount, formatVoucherDate, getVoucherAvailability } from "../../utils/beneficiary.js";
import "../../styles/week2.css";

export default function Vouchers() {
  const resource = useBeneficiaryResource(getMyVouchers);
  const [now, setNow] = useState(() => Date.now());
  const vouchers = resource.data;

  useEffect(() => {
    const nextExpiry = vouchers?.map((voucher) => voucher.expiryDate ? Date.parse(voucher.expiryDate) : null)
      .filter((expiry) => expiry !== null && expiry > now).sort((left, right) => left - right)[0];
    const delay = nextExpiry === undefined ? 30000 : Math.min(30000, Math.max(1, nextExpiry - Date.now() + 1));
    const timer = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [vouchers, now]);

  const counts = useMemo(() => ({
    allocated: vouchers?.filter((voucher) => voucher.status === VOUCHER_STATUSES.ALLOCATED).length ?? 0,
    committed: vouchers?.filter((voucher) => voucher.status === VOUCHER_STATUSES.COMMITTED).length ?? 0,
    settled: vouchers?.filter((voucher) => voucher.status === VOUCHER_STATUSES.SETTLED).length ?? 0,
  }), [vouchers]);

  if (resource.status === "forbidden") return <AccessRestricted />;

  return (
    <div className="w2-page">
      <Toast notice={resource.notice} onClose={resource.dismissNotice} />
      <PageHeader title="My Digital Vouchers" description="Use your allocated vouchers to purchase products from approved suppliers." icon={Ticket} />
      {resource.status === "loading" && <VoucherSkeleton />}
      {resource.status === "error" && <ModuleError title="Could not load your vouchers" message={resource.error} onRetry={resource.retry} />}
      {resource.status === "ready" && (
        <>
          <VoucherSummary counts={counts} />
          {vouchers.length ? <div className="w2-voucher-list">
            {vouchers.map((voucher) => <VoucherCard key={voucher.id} id={voucher.id} amount={formatVoucherAmount(voucher.amount)} status={voucher.status} allocationDate={formatVoucherDate(voucher.allocationDate)} expiryDate={voucher.expiryDate ? formatVoucherDate(voucher.expiryDate) : null} availability={getVoucherAvailability(voucher.status, voucher.expiryDate, now)} />)}
          </div> : <EmptyVouchers />}
          <VoucherRules hasExpiry={vouchers.some((voucher) => voucher.expiryDate !== null)} />
        </>
      )}
    </div>
  );
}
