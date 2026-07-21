"use client";

import { useParams } from "next/navigation";
import BayForm from "../../BayForm";

export default function EditBayPage() {
  const params = useParams();
  return <BayForm bayId={decodeURIComponent(String(params.bay))} />;
}
