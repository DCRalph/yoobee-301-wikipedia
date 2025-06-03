"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import {
  Edit3,
  Trophy,
  ChevronDown,
  Mail,
  Shield,
  Key,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";

export function AccountPage() {
  const { data: session, update } = useSession();

  // Profile editing state
  const [name, setName] = useState(session?.user?.name ?? "");
  const [imageUrl, setImageUrl] = useState(session?.user?.image ?? "");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password management state
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [addPasswordValue, setAddPasswordValue] = useState("");
  const [confirmAddPasswordValue, setConfirmAddPasswordValue] = useState("");
  const [addPasswordDialogOpen, setAddPasswordDialogOpen] = useState(false);

  // Get dashboard data
  const { data: suggestedTopics } = api.user.dashboard.getSuggestedTopics.useQuery();
  const { data: recentActivity } = api.user.dashboard.getRecentActivity.useQuery();
  const { data: userStats } = api.user.dashboard.getUserStats.useQuery();

  // Get profile data
  const {
    data: profileData,
    refetch: refetchProfile,
  } = api.user.profile.getMyProfile.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (profileData) {
      setName(profileData.name ?? "");
      setImageUrl(profileData.image ?? "");
    }
  }, [profileData]);

  // TRPC mutations
  const updateProfile = api.user.profile.updateProfile.useMutation({
    onSuccess: async () => {
      await update();
      await refetchProfile();
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const addPassword = api.user.profile.addPassword.useMutation({
    onSuccess: async () => {
      await refetchProfile();
      toast.success("Password added successfully");
      setAddPasswordValue("");
      setConfirmAddPasswordValue("");
      setAddPasswordDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add password: ${error.message}`);
    },
  });

  const changePassword = api.user.profile.changePassword.useMutation({
    onSuccess: async () => {
      await refetchProfile();
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    },
    onError: (error) => {
      toast.error(`Failed to change password: ${error.message}`);
    },
  });

  // Handlers
  const handleProfileUpdate = () => {
    updateProfile.mutate({
      name,
      image: imageUrl,
    });
  };

  const handleAddPassword = () => {
    if (addPasswordValue !== confirmAddPasswordValue) {
      toast.error("Passwords don't match");
      return;
    }

    if (addPasswordValue.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    addPassword.mutate({
      password: addPasswordValue,
    });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    changePassword.mutate({
      currentPassword,
      newPassword,
    });
  };

  // Helper functions
  const hasCredentialsAccount = profileData?.accounts?.some(
    (account) => account.provider === "credentials",
  );

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Please sign in to view your account</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Suggested Edits */}
            <Card className="bg-[var(--card)] overflow-hidden py-0 border-[var(--border)]">
              <CardHeader className="bg-[var(--primary)] py-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Suggested Edits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="mb-4 text-[var(--foreground)]">
                  {"Choose some topics you're interested in editing"}
                </p>
                <div className="space-y-3 mb-6">
                  {suggestedTopics?.topics.map((topic) => (
                    <div key={topic} className="relative">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-12 bg-[var(--secondary)] border-[var(--border)] text-[var(--foreground)]"
                      >
                        {topic}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity & Watch List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-[var(--foreground)]">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity?.hasActivity ? (
                    <div className="space-y-3">
                      {recentActivity.articles.slice(0, 3).map((article) => (
                        <div key={article.id} className="p-3 rounded bg-[var(--muted)]">
                          <h4 className="font-medium text-[var(--foreground)]">
                            {article.title}
                          </h4>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {new Date(article.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--muted-foreground)]">
                      {"You haven't made any edits yet. Start with suggested edits to begin your journey."}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-[var(--foreground)]">Watch list</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--muted-foreground)]">
                    Add articles to your watchlist to track changes and updates.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Account Management */}
            <Card className="bg-[var(--card)] overflow-hidden py-0 border-[var(--border)]">
              <CardHeader className="bg-[var(--primary)] py-3">
                <CardTitle className="text-white">Account Management</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="w-full rounded-none border-b bg-[var(--card)]">
                    <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                    <TabsTrigger value="linked-accounts" className="flex-1">Linked Accounts</TabsTrigger>
                    <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
                  </TabsList>

                  {/* Profile Tab */}
                  <TabsContent value="profile" className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={profileData?.image ?? ""}
                            alt={profileData?.name ?? "User"}
                          />
                          <AvatarFallback>
                            {profileData?.name
                              ? profileData.name.substring(0, 2).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            {profileData?.name ?? "Anonymous User"}
                          </h3>
                          <p className="text-[var(--muted-foreground)] flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {profileData?.email ?? "No email set"}
                          </p>
                          <p className="text-[var(--muted-foreground)] flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            {profileData?.role}
                          </p>
                        </div>
                      </div>

                      {isEditingProfile ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Your name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="imageUrl">Profile Image URL</Label>
                            <Input
                              id="imageUrl"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setName(profileData?.name ?? "");
                                setImageUrl(profileData?.image ?? "");
                                setIsEditingProfile(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleProfileUpdate}
                              disabled={updateProfile.isPending}
                            >
                              {updateProfile.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button onClick={() => setIsEditingProfile(true)}>
                            Edit Profile
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Linked Accounts Tab */}
                  <TabsContent value="linked-accounts" className="p-6">
                    <div className="space-y-4">
                      {/* Credentials Account */}
                      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
                        <div className="flex items-center gap-3">
                          <Key className="h-8 w-8 text-[var(--muted-foreground)]" />
                          <div>
                            <h3 className="font-medium text-[var(--foreground)]">Password</h3>
                            <p className="text-[var(--muted-foreground)] text-sm">
                              Email and password authentication
                            </p>
                          </div>
                        </div>
                        <div>
                          {hasCredentialsAccount ? (
                            <Button variant="outline" size="sm" className="gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Connected
                            </Button>
                          ) : (
                            <Dialog
                              open={addPasswordDialogOpen}
                              onOpenChange={setAddPasswordDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm">Add Password</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Set up password login</DialogTitle>
                                  <DialogDescription>
                                    Add a password to your account to enable email/password login
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="add-password">New Password</Label>
                                    <Input
                                      id="add-password"
                                      type="password"
                                      value={addPasswordValue}
                                      onChange={(e) => setAddPasswordValue(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="confirm-add-password">Confirm Password</Label>
                                    <Input
                                      id="confirm-add-password"
                                      type="password"
                                      value={confirmAddPasswordValue}
                                      onChange={(e) => setConfirmAddPasswordValue(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleAddPassword}
                                    disabled={
                                      addPassword.isPending ||
                                      !addPasswordValue ||
                                      addPasswordValue !== confirmAddPasswordValue
                                    }
                                  >
                                    {addPassword.isPending ? "Adding..." : "Add Password"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {/* Google Account */}
                      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
                        <div className="flex items-center gap-3">
                          <FcGoogle className="h-8 w-8" />
                          <div>
                            <h3 className="font-medium text-[var(--foreground)]">Google</h3>
                            <p className="text-[var(--muted-foreground)] text-sm">
                              Login with your Google account
                            </p>
                          </div>
                        </div>
                        <div>
                          {profileData?.accounts?.some((account) => account.provider === "google") ? (
                            <Button variant="outline" size="sm" className="gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Connected
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" asChild>
                              <Link href="/api/auth/signin?provider=google&callbackUrl=/account">
                                Connect
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Discord Account */}
                      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
                        <div className="flex items-center gap-3">
                          <FaDiscord className="h-8 w-8 text-[#5865F2]" />
                          <div>
                            <h3 className="font-medium text-[var(--foreground)]">Discord</h3>
                            <p className="text-[var(--muted-foreground)] text-sm">
                              Login with your Discord account
                            </p>
                          </div>
                        </div>
                        <div>
                          {profileData?.accounts?.some((account) => account.provider === "discord") ? (
                            <Button variant="outline" size="sm" className="gap-1">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Connected
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await signIn("discord", {
                                  redirect: false,
                                  callbackUrl: "/account",
                                });
                              }}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="p-6">
                    {hasCredentialsAccount ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-[var(--foreground)]">Change Password</h3>
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={handleChangePassword}
                          disabled={
                            changePassword.isPending ||
                            !currentPassword ||
                            !newPassword ||
                            newPassword !== confirmNewPassword
                          }
                        >
                          {changePassword.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No Password Set</AlertTitle>
                          <AlertDescription>
                            {"You don't have a password set for your account. You can add one from the Linked Accounts tab."}
                          </AlertDescription>
                        </Alert>
                        <Button
                          onClick={() => {
                            const tabsList = document.querySelector('[role="tablist"]');
                            const linkedAccountsTab = tabsList?.querySelector('[value="linked-accounts"]');
                            if (linkedAccountsTab && "click" in linkedAccountsTab) {
                              (linkedAccountsTab as HTMLElement).click();
                              setTimeout(() => {
                                setAddPasswordDialogOpen(true);
                              }, 100);
                            }
                          }}
                        >
                          Add Password Now
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Your Contributions */}
            <Card className="bg-[var(--card)] overflow-hidden py-0 border-[var(--border)]">
              <CardHeader className="bg-[var(--primary)] py-3">
                <CardTitle className="text-white">Your Contributions</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <Tabs defaultValue="recent-edits" className="w-full">
                  <TabsList className="w-full rounded-none border-b bg-[var(--card)]">
                    <TabsTrigger value="recent-edits" className="flex-1">Recent Edits</TabsTrigger>
                    <TabsTrigger value="articles-created" className="flex-1">Articles Created</TabsTrigger>
                  </TabsList>
                  <TabsContent value="recent-edits">
                    {recentActivity?.hasActivity ? (
                      <div className="space-y-3">
                        {recentActivity.articles.map((article) => (
                          <div key={article.id} className="flex items-center justify-between p-3 rounded bg-[var(--muted)]">
                            <div>
                              <h4 className="font-medium text-[var(--foreground)]">
                                {article.title}
                              </h4>
                              <p className="text-sm text-[var(--muted-foreground)]">
                                {new Date(article.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={article.published ? "default" : "secondary"}>
                              {article.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--muted-foreground)]">
                        {"You haven't made any edits yet."}
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="articles-created" className="p-6">
                    {userStats?.articlesCreated?.hasArticles ? (
                      <div className="space-y-3">
                        {userStats.articlesCreated.articles.map((article) => (
                          <div key={article.id} className="flex items-center justify-between p-3 rounded bg-[var(--muted)]">
                            <div>
                              <h4 className="font-medium text-[var(--foreground)]">
                                {article.title}
                              </h4>
                              <p className="text-sm text-[var(--muted-foreground)]">
                                Created {new Date(article.createdAt).toLocaleDateString()}
                              </p>
                              {article.viewCount > 0 && (
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  {article.viewCount} views
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={article.published ? "default" : "secondary"}>
                                {article.published ? "Published" : "Draft"}
                              </Badge>
                              {article.published && article.approved && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  Approved
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--muted-foreground)]">
                        {"You haven't created any articles yet."}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
                <div className="p-6 border-t border-[var(--border)]">
                  <Button variant="outline" className="w-full">
                    View all contributions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Profile */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-6 text-center">
                <div className="relative mb-4">
                  <Avatar className="w-24 h-24 mx-auto border-4 border-blue-500">
                    <AvatarImage src={userStats?.user?.image ?? ""} />
                    <AvatarFallback className="text-2xl">
                      {userStats?.user?.name?.substring(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {session?.user?.email?.split("@")[0] ?? "User"}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-[var(--foreground)]">
                  {userStats?.user?.name ?? "Anonymous User"}
                </h3>
                <p className="text-sm mb-4 text-[var(--muted-foreground)]">
                  Member since {userStats?.stats.memberSince ?
                    new Date(userStats.stats.memberSince).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    }) : 'Unknown'
                  }
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Edit3 className="w-4 h-4 mr-1 text-[var(--muted-foreground)]" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">
                      {userStats?.stats.totalEdits ?? 0}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Edits
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Trophy className="w-4 h-4 mr-1 text-[var(--muted-foreground)]" />
                    </div>
                    <div className="text-2xl font-bold text-[var(--foreground)]">
                      {userStats?.stats.totalArticlesCreated ?? 0}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Articles Created
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="w-full mt-4 bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
