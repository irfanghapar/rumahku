"use client";

import { useParams } from "next/navigation";
import OwnerForm from "../../OwnerForm";

export default function EditOwnerPage() {
  const params = useParams();
  return <OwnerForm ownerId={decodeURIComponent(String(params.id))} />;
}
