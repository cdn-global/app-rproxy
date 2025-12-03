import { Link, createFileRoute } from "@tanstack/react-router"
import {
  FiPlus,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { hostingServers } from "@/data/hosting"
import {
  PageScaffold,
} from "@/components/Common/PageLayout"
function ManagedDatabaseIndexPage() {
  return (
    <PageScaffold sidebar={null}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Managed Database</h1>
          <p className="text-muted-foreground">
            Administer your managed relational databases.
          </p>
        </div>
        <Button asChild>
          <Link to="/managed-database/instance">
            <FiPlus className="mr-2" />
            New Database
          </Link>
        </Button>
      </div>
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Managed Databases</CardTitle>
              <Badge variant="outline">PostgreSQL</Badge>
            </div>
            <CardDescription>
              Administer your managed relational databases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>vCPUs</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostingServers.map((server) => (
                  <TableRow key={server.name}>
                    <TableCell>
                      <Link
                        to="/managed-database/instance"
                        className="text-blue-500 hover:underline"
                      >
                        {server.name}
                      </Link>
                    </TableCell>
                    <TableCell>{server.status}</TableCell>
                    <TableCell>{server.ip}</TableCell>
                    <TableCell>{server.os}</TableCell>
                    <TableCell>{server.vCPUs}</TableCell>
                    <TableCell>{server.ramGB}GB</TableCell>
                    <TableCell>{server.storageSizeGB}GB</TableCell>
                    <TableCell>${server.monthlyComputePrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/managed-database/")({
  component: ManagedDatabaseIndexPage,
})