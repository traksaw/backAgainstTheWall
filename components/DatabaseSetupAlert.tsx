// "use client"

// import { useState } from "react"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { CheckCircle, AlertTriangle, Database, ExternalLink, Copy, Check } from "lucide-react"

// interface DatabaseSetupAlertProps {
//   databaseStatus?: "checking" | "ready" | "setup-required" | "error"
// }

// export function DatabaseSetupAlert({ databaseStatus = "checking" }: DatabaseSetupAlertProps) {
//   const [showSetupGuide, setShowSetupGuide] = useState(false)
//   const [copiedStep, setCopiedStep] = useState<number | null>(null)

//   const copyToClipboard = async (text: string, stepNumber: number) => {
//     try {
//       await navigator.clipboard.writeText(text)
//       setCopiedStep(stepNumber)
//       setTimeout(() => setCopiedStep(null), 2000)
//     } catch (err) {
//       console.error("Failed to copy text: ", err)
//     }
//   }

//   if (databaseStatus === "ready") {
//     return null
//   }

//   if (databaseStatus === "checking") {
//     return (
//       <Alert className="mx-4 mt-4 border-blue-200 bg-blue-50">
//         <Database className="h-4 w-4 text-blue-600" />
//         <AlertDescription className="text-blue-800">Checking database connection...</AlertDescription>
//       </Alert>
//     )
//   }

//   return (
//     <>
//       <Alert className="mx-4 mt-4 border-orange-200 bg-orange-50">
//         <AlertTriangle className="h-4 w-4 text-orange-600" />
//         <AlertDescription className="flex items-center justify-between text-orange-800">
//           <span>Database setup required to save quiz results and user profiles.</span>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setShowSetupGuide(true)}
//             className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
//           >
//             Setup Guide
//           </Button>
//         </AlertDescription>
//       </Alert>

//       <Dialog open={showSetupGuide} onOpenChange={setShowSetupGuide}>
//         <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <Database className="h-5 w-5 text-blue-600" />
//               Database Setup Guide
//             </DialogTitle>
//             <DialogDescription>
//               Follow these steps to set up your Supabase database for the quiz application.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-6">
//             {/* Step 1: Create Supabase Project */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Badge variant="outline">1</Badge>
//                   Create Supabase Project
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <p className="text-sm text-gray-600">First, create a new Supabase project if you haven't already.</p>
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
//                   >
//                     <ExternalLink className="h-4 w-4 mr-2" />
//                     Open Supabase Dashboard
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Step 2: Run SQL Scripts */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Badge variant="outline">2</Badge>
//                   Run Database Scripts
//                 </CardTitle>
//                 <CardDescription>
//                   Execute these SQL scripts in your Supabase SQL editor to create the required tables.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-4">
//                   <div>
//                     <div className="flex items-center justify-between mb-2">
//                       <h4 className="font-medium">Create Tables Script</h4>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() =>
//                           copyToClipboard(
//                             `-- Create user_profiles table
// CREATE TABLE IF NOT EXISTS user_profiles (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//     first_name TEXT NOT NULL,
//     last_name TEXT NOT NULL,
//     email TEXT NOT NULL,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     UNIQUE(user_id)
// );

// -- Create quiz_results table
// CREATE TABLE IF NOT EXISTS quiz_results (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//     session_id TEXT NOT NULL,
//     archetype TEXT NOT NULL,
//     score INTEGER NOT NULL,
//     answers JSONB NOT NULL,
//     has_viewed_results BOOLEAN DEFAULT FALSE,
//     has_watched_film BOOLEAN DEFAULT FALSE,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// -- Enable Row Level Security
// ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
// ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

// -- Create policies for user_profiles
// CREATE POLICY "Users can view own profile" ON user_profiles
//     FOR SELECT USING (auth.uid() = user_id);

// CREATE POLICY "Users can insert own profile" ON user_profiles
//     FOR INSERT WITH CHECK (auth.uid() = user_id);

// CREATE POLICY "Users can update own profile" ON user_profiles
//     FOR UPDATE USING (auth.uid() = user_id);

// -- Create policies for quiz_results
// CREATE POLICY "Users can view own quiz results" ON quiz_results
//     FOR SELECT USING (auth.uid() = user_id);

// CREATE POLICY "Users can insert own quiz results" ON quiz_results
//     FOR INSERT WITH CHECK (auth.uid() = user_id);

// CREATE POLICY "Users can update own quiz results" ON quiz_results
//     FOR UPDATE USING (auth.uid() = user_id);`,
//                             1,
//                           )
//                         }
//                       >
//                         {copiedStep === 1 ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
//                       </Button>
//                     </div>
//                     <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
//                       <pre>{`-- Create user_profiles table
// CREATE TABLE IF NOT EXISTS user_profiles (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//     first_name TEXT NOT NULL,
//     last_name TEXT NOT NULL,
//     email TEXT NOT NULL,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     UNIQUE(user_id)
// );

// -- Create quiz_results table
// CREATE TABLE IF NOT EXISTS quiz_results (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//     session_id TEXT NOT NULL,
//     archetype TEXT NOT NULL,
//     score INTEGER NOT NULL,
//     answers JSONB NOT NULL,
//     has_viewed_results BOOLEAN DEFAULT FALSE,
//     has_watched_film BOOLEAN DEFAULT FALSE,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// -- Enable Row Level Security
// ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
// ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

// -- Create policies for user_profiles
// CREATE POLICY "Users can view own profile" ON user_profiles
//     FOR SELECT USING (auth.uid() = user_id);

// CREATE POLICY "Users can insert own profile" ON user_profiles
//     FOR INSERT WITH CHECK (auth.uid() = user_id);

// CREATE POLICY "Users can update own profile" ON user_profiles
//     FOR UPDATE USING (auth.uid() = user_id);

// -- Create policies for quiz_results
// CREATE POLICY "Users can view own quiz results" ON quiz_results
//     FOR SELECT USING (auth.uid() = user_id);

// CREATE POLICY "Users can insert own quiz results" ON quiz_results
//     FOR INSERT WITH CHECK (auth.uid() = user_id);

// CREATE POLICY "Users can update own quiz results" ON quiz_results
//     FOR UPDATE USING (auth.uid() = user_id);`}</pre>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Step 3: Environment Variables */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Badge variant="outline">3</Badge>
//                   Configure Environment Variables
//                 </CardTitle>
//                 <CardDescription>Add your Supabase credentials to your .env.local file.</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div>
//                   <div className="flex items-center justify-between mb-2">
//                     <h4 className="font-medium">Environment Variables</h4>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() =>
//                         copyToClipboard(
//                           `NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`,
//                           2,
//                         )
//                       }
//                     >
//                       {copiedStep === 2 ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
//                     </Button>
//                   </div>
//                   <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
//                     <pre>{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}</pre>
//                   </div>
//                   <p className="text-sm text-gray-600 mt-2">
//                     You can find these values in your Supabase project settings under "API".
//                   </p>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Step 4: Verification */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Badge variant="outline">4</Badge>
//                   Verify Setup
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm text-gray-600 mb-4">
//                   After completing the setup, refresh this page. The alert should disappear if everything is configured
//                   correctly.
//                 </p>
//                 <div className="flex items-center gap-2 text-green-600">
//                   <CheckCircle className="h-4 w-4" />
//                   <span className="text-sm font-medium">
//                     Once setup is complete, users will be able to sign up, take quizzes, and save their results.
//                   </span>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           <div className="flex justify-end pt-4 border-t">
//             <Button onClick={() => setShowSetupGuide(false)}>Close Guide</Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }
