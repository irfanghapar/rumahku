"use client";

import { useParams } from "next/navigation";
import BillingCodeForm from "../../BillingCodeForm";

export default function EditBillingCodePage() {
  const params = useParams();
  return <BillingCodeForm code={decodeURIComponent(String(params.code))} />;
}
