import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiFileText, FiMail, FiTrash } from "react-icons/fi"

import {
  type ApiError,
  type ItemPublic,
  type UserPublic,
  UsersService,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import EditUser from "../Admin/EditUser"
import UserEvidencePanel from "../Admin/UserEvidencePanel"
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
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)
  const showToast = useCustomToast()

  const isVerified =
    type === "User" &&
    Boolean((value as UserPublic & { email_verified_at?: string | null }).email_verified_at)

  const resendVerificationMutation = useMutation({
    mutationFn: () =>
      UsersService.resendVerificationEmail({ userId: value.id }),
    onSuccess: () => {
      showToast("Success!", "Verification email sent.", "success")
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

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
        <DropdownMenuContent align="end" className="w-48">
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
          {type === "User" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  setIsEvidenceOpen(true)
                }}
                className="gap-2"
              >
                <FiFileText className="h-4 w-4" />
                Evidence Pack
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  if (!isVerified) {
                    resendVerificationMutation.mutate()
                  }
                }}
                disabled={isVerified || resendVerificationMutation.isPending}
                className="gap-2"
              >
                <FiMail className="h-4 w-4" />
                {isVerified ? "Email verified" : "Resend verification email"}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
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
        <>
          <EditUser
            user={value as UserPublic}
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />
          <UserEvidencePanel
            user={value as UserPublic}
            isOpen={isEvidenceOpen}
            onClose={() => setIsEvidenceOpen(false)}
          />
        </>
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
