import type { ComponentType, ElementType } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface NavbarProps {
  type: string
  addModalAs: ComponentType | ElementType
}

const Navbar = ({ type, addModalAs }: NavbarProps) => {
  const AddModal = addModalAs
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/70 px-5 py-4 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.75)]">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 uppercase tracking-[0.2em] text-[0.65rem] text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-400">
          Quick actions
        </span>
        <span>Manage {type.toLowerCase()} records</span>
      </div>
      <Button variant="primary" size="sm" className="gap-2" onClick={handleOpen}>
        <Plus className="h-4 w-4" /> Add {type}
      </Button>
      <AddModal isOpen={isOpen} onClose={handleClose} />
    </div>
  )
}

export default Navbar
