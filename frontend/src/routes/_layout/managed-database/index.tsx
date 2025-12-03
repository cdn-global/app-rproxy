import { createFileRoute, Link } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { hostingServers } from "@/data/hosting"

function ManagedDatabaseIndexPage() {
  return (
    <div className="space-y-10 py-10">
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
  )
}

export const Route = createFileRoute('/_layout/managed-database/')({
  component: ManagedDatabaseIndexPage,
})
