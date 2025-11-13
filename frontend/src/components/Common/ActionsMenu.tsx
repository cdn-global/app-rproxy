import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiTrash } from "react-icons/fi"

import type { ItemPublic, UserPublic } from "../../client"
import EditUser from "../Admin/EditUser"
import EditItem from "../Items/EditItem"
import Delete from "./DeleteAlert"

interface UserActionsMenuProps {
  type: "User"
  value: UserPublic
  disabled?: boolean
}

interface ItemActionsMenuProps {
  type: "Item"
  value: ItemPublic
  disabled?: boolean
}

type ActionsMenuProps = UserActionsMenuProps | ItemActionsMenuProps

const ActionsMenu = ({ type, value, disabled }: ActionsMenuProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            disabled={disabled}
            aria-label={`${type} actions`}
          >
            <BsThreeDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setIsEditOpen(true)
            }}
            className="gap-2"
          >
            <FiEdit className="h-4 w-4" />
            Edit {type}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setIsDeleteOpen(true)
            }}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <FiTrash className="h-4 w-4" />
            Delete {type}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {type === "User" ? (
        <EditUser
          user={value as UserPublic}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      ) : (
        <EditItem
          item={value as ItemPublic}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
      <Delete
        type={type}
        id={value.id}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  )
}

export default ActionsMenu
