import CreateGroup from "@/components/group/CreateGroup"
import GroupList from "./GroupList"

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-2 py-6">
      <CreateGroup />
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Existing groups</h2>
        <GroupList />
      </div>
    </div>
  )
}
