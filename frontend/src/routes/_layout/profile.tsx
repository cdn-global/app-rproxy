import { createFileRoute } from "@tanstack/react-router"
import PageScaffold, { PageSection } from "@/components/Common/PageLayout"
import ChangePassword from "@/components/UserSettings/ChangePassword"
import UserInformation from "@/components/UserSettings/UserInformation"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import ApiKeySettings from "@/components/UserSettings/ApiKeySettings"

function ProfilePage() {
  return (
    <PageScaffold className="py-8" sidebar={null}>
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-4xl space-y-4 text-center">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Profile Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your account settings and preferences
          </p>
        </div>

        <PageSection
          id="information"
          title="Account Information"
          description="Update your personal information and contact details"
        >
          <UserInformation />
        </PageSection>

        <PageSection
          id="api-key"
          title="API Configuration"
          description="Configure your API keys for LLM providers. All usage is tracked for billing."
        >
          <ApiKeySettings />
        </PageSection>

        <PageSection
          id="security"
          title="whatSecurity"
          description="Update your password and manage account security"
        >
          <ChangePassword />
        </PageSection>

        <PageSection
          id="danger"
          title="Danger Zone"
          description="Permanently delete your account and all associated data"
        >
          <DeleteAccount />
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/profile")({
  component: ProfilePage,
})

export default ProfilePage
