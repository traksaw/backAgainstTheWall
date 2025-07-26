// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { QuizService } from "@/lib/quiz"
// // import { testSupabaseConnection, checkTablesExist } from "@/lib/supabase"
// import { useAuth } from "@/hooks/useAuth"
// import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw, FolderSyncIcon as Sync, Info } from "lucide-react"

// interface DatabaseStatusProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }

// export function DatabaseStatus({ open, onOpenChange }: DatabaseStatusProps) {
//   const { user } = useAuth()
//   const [connectionStatus, setConnectionStatus] = useState<any>(null)
//   const [tableStatus, setTableStatus] = useState<any[]>([])
//   const [loading, setLoading] = useState(false)
//   const [syncing, setSyncing] = useState(false)
//   const [syncResult, setSyncResult] = useState<any>(null)

//   const checkDatabaseStatus = async () => {
//     setLoading(true)
//     try {
//       // Test connection
//       const connection = await testSupabaseConnection()
//       setConnectionStatus(connection)

//       // Check tables
//       const tables = await checkTablesExist()
//       setTableStatus(tables)
//     } catch (error) {
//       console.error("Error checking database status:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const syncLocalData = async () => {
//     if (!user) return

//     setSyncing(true)
//     try {
//       const result = await QuizService.syncLocalStorageToDatabase(user.id)
//       setSyncResult(result)
//     } catch (error) {
//       console.error("Error syncing data:", error)
//       setSyncResult({ success: false, error })
//     } finally {
//       setSyncing(false)
//     }
//   }

//   useEffect(() => {
//     if (open) {
//       checkDatabaseStatus()
//     }
//   }, [open])

//   if (!open) return null

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <Card className="w-full max-w-2xl bg-white">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="flex items-center">
//               <Database className="w-5 h-5 mr-2" />
//               Database Status
//             </CardTitle>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => onOpenChange(false)}
//               className="text-gray-500 hover:text-gray-700"
//             >
//               ×
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Connection Status */}
//           <div className="space-y-3">
//             <h3 className="font-semibold flex items-center">
//               Connection Status
//               <Button variant="ghost" size="sm" onClick={checkDatabaseStatus} disabled={loading} className="ml-2">
//                 <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//               </Button>
//             </h3>

//             {connectionStatus && (
//               <div className="flex items-center space-x-2">
//                 {connectionStatus.success ? (
//                   <>
//                     <CheckCircle className="w-5 h-5 text-green-500" />
//                     <Badge className="bg-green-100 text-green-800">Connected</Badge>
//                     <span className="text-sm text-gray-600">{connectionStatus.message}</span>
//                   </>
//                 ) : (
//                   <>
//                     <XCircle className="w-5 h-5 text-red-500" />
//                     <Badge className="bg-red-100 text-red-800">Disconnected</Badge>
//                     <span className="text-sm text-gray-600">{connectionStatus.message}</span>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Table Status */}
//           <div className="space-y-3">
//             <h3 className="font-semibold">Table Status</h3>
//             <div className="space-y-2">
//               {tableStatus.map((table, index) => (
//                 <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <span className="font-medium">{table.table}</span>
//                   <div className="flex items-center space-x-2">
//                     {table.exists ? (
//                       <>
//                         <CheckCircle className="w-4 h-4 text-green-500" />
//                         <Badge className="bg-green-100 text-green-800 text-xs">Ready</Badge>
//                       </>
//                     ) : (
//                       <>
//                         <XCircle className="w-4 h-4 text-red-500" />
//                         <Badge className="bg-red-100 text-red-800 text-xs">Missing</Badge>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Data Sync */}
//           {user && (
//             <div className="space-y-3">
//               <h3 className="font-semibold">Data Synchronization</h3>
//               <Alert>
//                 <Info className="h-4 w-4" />
//                 <AlertDescription>
//                   If you have quiz results stored locally, you can sync them to the database.
//                 </AlertDescription>
//               </Alert>

//               <Button onClick={syncLocalData} disabled={syncing || !connectionStatus?.success} className="w-full">
//                 {syncing ? (
//                   <>
//                     <Sync className="w-4 h-4 mr-2 animate-spin" />
//                     Syncing Data...
//                   </>
//                 ) : (
//                   <>
//                     <Sync className="w-4 h-4 mr-2" />
//                     Sync Local Data to Database
//                   </>
//                 )}
//               </Button>

//               {syncResult && (
//                 <Alert className={syncResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
//                   {syncResult.success ? (
//                     <CheckCircle className="h-4 w-4 text-green-600" />
//                   ) : (
//                     <AlertTriangle className="h-4 w-4 text-red-600" />
//                   )}
//                   <AlertDescription className={syncResult.success ? "text-green-800" : "text-red-800"}>
//                     {syncResult.success
//                       ? `Successfully synced ${syncResult.synced} quiz results to database.`
//                       : `Sync failed: ${syncResult.error?.message || "Unknown error"}`}
//                   </AlertDescription>
//                 </Alert>
//               )}
//             </div>
//           )}

//           {/* Instructions */}
//           <div className="space-y-3">
//             <h3 className="font-semibold">Setup Instructions</h3>
//             <div className="text-sm text-gray-600 space-y-2">
//               <p>1. Ensure your Supabase project is set up with the correct environment variables</p>
//               <p>2. Run the database migration scripts in the correct order</p>
//               <p>3. Verify that Row Level Security (RLS) policies are enabled</p>
//               <p>4. Test the connection using the refresh button above</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
