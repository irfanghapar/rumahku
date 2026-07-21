"use client";

import { useParams } from "next/navigation";
import LotForm from "../../LotForm";

export default function EditLotPage() {
  const params = useParams();
  return <LotForm lotId={decodeURIComponent(String(params.id))} />;
}
