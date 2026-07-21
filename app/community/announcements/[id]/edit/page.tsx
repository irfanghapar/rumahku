"use client";

import { useParams } from "next/navigation";
import AnnouncementForm from "../../AnnouncementForm";

export default function EditAnnouncementPage() {
  const params = useParams();
  return <AnnouncementForm id={decodeURIComponent(String(params.id))} />;
}
