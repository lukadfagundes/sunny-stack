'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, UserPlus, Shield, Clock, Mail, Key, Copy, 
  CheckCircle, AlertCircle, Trash2, Edit, RefreshCw,
  Lock, Unlock, ChevronDown, ChevronUp, X
} from 'lucide-react'

interface User {
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
  expires_at?: string
  is_temporary: boolean
  app_access: string[]
}

interface TempUserCredentials {
  email: string
  temporary_password: string
  expires_at: string
  login_url: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [tempCredentials, setTempCredentials] = useState<TempUserCredentials | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'client_demo',
    app_access: [] as string[],
    expires_in_hours: 24
  })

  const roles = [
    { id: 'client_demo', name: 'Client Demo', color: 'blue' },
    { id: 'tester', name: 'Tester', color: 'green' },
    { id: 'prospect', name: 'Prospect', color: 'purple' },
    { id: 'readonly', name: 'Read Only', color: 'gray' },
    { id: 'admin', name: 'Admin', color: 'red' }
  ]

  const applications = [
    { id: 'sunny', name: 'Sunny Stack', icon: '🌟' },
    { id: 'navigatorcore', name: 'NavigatorCore', icon: '🚀' },
    { id: 'client_demo', name: 'Client Demo', icon: '🎯' },
    { id: 'test_environment', name: 'Test Environment', icon: '🧪' },
    { id: 'admin_panel', name: 'Admin Panel', icon: '⚙️' }
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/auth/users?include_inactive=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createTempUser = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/auth/create-temp-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const credentials = await response.json()
        setTempCredentials(credentials)
        setShowCreateModal(false)
        fetchUsers() // Refresh user list
        
        // Reset form
        setFormData({
          email: '',
          name: '',
          role: 'client_demo',
          app_access: [],
          expires_in_hours: 24
        })
      }
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const deactivateUser = async (email: string) => {
    if (!confirm(`Are you sure you want to deactivate ${email}?`)) return
    
    try {
      const token = localStorage.getItem('access_token')
      await fetch(`/api/auth/users/${email}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      fetchUsers()
    } catch (error) {
      console.error('Failed to deactivate user:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.id === role)
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800'
    }
    return colors[roleConfig?.color as keyof typeof colors] || colors.gray
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
              <p className="text-gray-600">Manage access and permissions for Sunny platform</p>
            </div>
          </div>
          
          <motion.button
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create Temp User</span>
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Temporary</p>
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.is_temporary).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Admins</p>
              <p className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'admin' || u.role === 'master_admin').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">All Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.is_active ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-sm text-red-600">Inactive</span>
                        </>
                      )}
                    </div>
                    {user.is_temporary && user.expires_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(user.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.app_access.slice(0, 3).map((app) => (
                        <span key={app} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {app}
                        </span>
                      ))}
                      {user.app_access.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          +{user.app_access.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.role !== 'master_admin' && (
                        <button
                          onClick={() => deactivateUser(user.email)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Create Temporary User</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="user@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Access
                  </label>
                  <div className="space-y-2">
                    {applications.map((app) => (
                      <label key={app.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.app_access.includes(app.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                app_access: [...formData.app_access, app.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                app_access: formData.app_access.filter(a => a !== app.id)
                              })
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="mr-2">{app.icon}</span>
                        <span>{app.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires In (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.expires_in_hours}
                    onChange={(e) => setFormData({ ...formData, expires_in_hours: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    min="1"
                    max="720"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTempUser}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credentials Modal */}
      <AnimatePresence>
        {tempCredentials && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">User Created Successfully!</h2>
                <p className="text-gray-600 mt-2">Share these credentials with the user</p>
              </div>

              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <span className="text-sm font-mono">{tempCredentials.email}</span>
                    <button
                      onClick={() => copyToClipboard(tempCredentials.email)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Temporary Password</label>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <span className="text-sm font-mono">{tempCredentials.temporary_password}</span>
                    <button
                      onClick={() => copyToClipboard(tempCredentials.temporary_password)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Login URL</label>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <span className="text-sm text-blue-600 truncate">{tempCredentials.login_url}</span>
                    <button
                      onClick={() => copyToClipboard(tempCredentials.login_url)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Expires At</label>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <span className="text-sm">{new Date(tempCredentials.expires_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setTempCredentials(null)}
                className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}