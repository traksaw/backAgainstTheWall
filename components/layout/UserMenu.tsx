// components/layout/UserMenu.tsx
"use client"

import { Button } from "@/components/ui/button"
import { User, BarChart3, LogOut } from "lucide-react"

interface User {
  _id: string;
  email: string;
}

interface Profile {
  first_name: string;
  last_name: string;
}

interface UserMenuProps {
  user: User | null;
  profile: Profile | null;
  onSignOut: () => void;
  onShowQuizHistory: () => void;
}

export function UserMenu({ user, profile, onSignOut, onShowQuizHistory }: UserMenuProps) {
  if (!user) {
    return null
  }

  return (
    <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50">
      <div className="flex items-center space-x-2 sm:space-x-4 bg-white rounded-full shadow-lg px-3 sm:px-4 py-2 border">
        {/* User info - hide name on very small screens */}
        <div className="hidden xs:flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-600" />
          <span className="text-xs sm:text-sm font-medium text-gray-700 max-w-[100px] sm:max-w-none truncate">
            {profile?.first_name} {profile?.last_name}
          </span>
        </div>
        
        {/* Show just user icon on very small screens */}
        <div className="flex xs:hidden">
          <User className="w-4 h-4 text-gray-600" />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowQuizHistory}
          className="text-gray-600 hover:text-[#B95D38]/90 p-2 min-w-[36px] min-h-[36px]"
          title="View Quiz History"
        >
          <BarChart3 className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSignOut} 
          className="text-gray-600 hover:text-red-600 p-2 min-w-[36px] min-h-[36px]"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}