import { EditLink } from "@/components/EditLink";
import { getAdmin } from "@/lib/auth";

/** Renders the edit affordance only for signed-in admins. */
export async function AdminEditLink({ file, className = "" }: { file: string; className?: string }) {
  const { isAdmin } = await getAdmin();
  if (!isAdmin) return null;
  return <EditLink file={file} className={className} />;
}
