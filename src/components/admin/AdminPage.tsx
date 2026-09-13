import CreateGroup from "@/components/admin/CreateGroup"
import BackLink from "@/components/ui/back-link"

// There is no list of every group here: a person may read only the groups
// they are a member of (rasmussvala/opensplit-native#58).
export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-2 py-6">
      <BackLink to="/" />
      <CreateGroup />
    </div>
  )
}
