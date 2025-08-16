// components/layout/UserMenu.tsx
"use client"

import { Button } from "@/components/ui/button"
import { User, BarChart3, LogOut } from "lucide-react"

interface UserMenuProps {
  user: any
  profile: any
  onSignOut: () => void
  onShowQuizHistory: () => void
}

export function UserMenu({ user, profile, onSignOut, onShowQuizHistory }: UserMenuProps) {
  if (!user) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Mobile Layout - Compact */}
      <div className="block md:hidden">
        <div className="flex items-center space-x-2 bg-white rounded-full shadow-lg px-3 py-2 border">
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700 max-w-[80px] truncate">
              {profile?.first_name}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowQuizHistory}
            className="text-gray-600 hover:text-[#B95D38]/90 p-1 h-auto min-w-0"
            title="View Quiz History"
          >
            <BarChart3 className="w-3 h-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSignOut} 
            className="text-gray-600 hover:text-red-600 p-1 h-auto min-w-0"
            title="Sign Out"
          >
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Desktop Layout - Full */}
      <div className="hidden md:block">
        <div className="flex items-center space-x-4 bg-white rounded-full shadow-lg px-4 py-2 border">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {profile?.first_name} {profile?.last_name}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowQuizHistory}
            className="text-gray-600 hover:text-[#B95D38]/90"
            title="View Quiz History"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSignOut} 
            className="text-gray-600 hover:text-red-600"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}