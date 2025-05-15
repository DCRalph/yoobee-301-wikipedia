"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import { toast } from "sonner";
import {
  User,
  Mail,
  Shield,
  Key,
  Lock,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";

export function AccountPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [imageUrl, setImageUrl] = useState(session?.user?.image ?? "");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [addPasswordValue, setAddPasswordValue] = useState("");
  const [confirmAddPasswordValue, setConfirmAddPasswordValue] = useState("");
  const [addPasswordDialogOpen, setAddPasswordDialogOpen] = useState(false);

  // Get profile data
  const {
    data: profileData,
    isLoading,
    refetch,
  } = api.user.profile.getMyProfile.useQuery(undefined, {
    // Refetch on window focus to ensure we have latest data
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (profileData) {
      setName(profileData.name ?? "");
      setImageUrl(profileData.image ?? "");
    }
  }, [profileData]);

  // TRPCs
  const updateProfile = api.user.profile.updateProfile.useMutation({
    onSuccess: async () => {
      await update();
      await refetch(); // Refetch profile data
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const addPassword = api.user.profile.addPassword.useMutation({
    onSuccess: async () => {
      await refetch(); // Refetch profile data
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
      await refetch(); // Refetch profile data
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

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold">
            Loading account information...
          </h1>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold">
            Failed to load account information
          </h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was a problem loading your account information. Please try
              refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Your Account</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="linked-accounts">Linked Accounts</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Manage your personal information and how it appears
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={profileData.image ?? ""}
                      alt={profileData.name ?? "User"}
                    />
                    <AvatarFallback>
                      {profileData.name
                        ? profileData.name.substring(0, 2).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {profileData.name ?? "Anonymous User"}
                    </h3>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profileData.email ?? "No email set"}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      {profileData.role}
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
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {isEditingProfile ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setName(profileData.name ?? "");
                        setImageUrl(profileData.image ?? "");
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
                  </>
                ) : (
                  <Button onClick={() => setIsEditingProfile(true)}>
                    Edit Profile
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Linked Accounts Tab */}
          <TabsContent value="linked-accounts">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Linked Accounts
                </CardTitle>
                <CardDescription>
                  Manage accounts that are linked to your profile for
                  authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Credentials Account */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Key className="h-8 w-8" />
                      <div>
                        <h3 className="font-medium">Password</h3>
                        <p className="text-muted-foreground text-sm">
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
                                Add a password to your account to enable
                                email/password login
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="add-password">
                                  New Password
                                </Label>
                                <Input
                                  id="add-password"
                                  type="password"
                                  value={addPasswordValue}
                                  onChange={(e) =>
                                    setAddPasswordValue(e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirm-add-password">
                                  Confirm Password
                                </Label>
                                <Input
                                  id="confirm-add-password"
                                  type="password"
                                  value={confirmAddPasswordValue}
                                  onChange={(e) =>
                                    setConfirmAddPasswordValue(e.target.value)
                                  }
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
                                {addPassword.isPending
                                  ? "Adding..."
                                  : "Add Password"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  {/* Google Account */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <FcGoogle className="h-8 w-8" />
                      <div>
                        <h3 className="font-medium">Google</h3>
                        <p className="text-muted-foreground text-sm">
                          Login with your Google account
                        </p>
                      </div>
                    </div>
                    <div>
                      {profileData.accounts.some(
                        (account) => account.provider === "google",
                      ) ? (
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
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <FaDiscord className="h-8 w-8 text-[#5865F2]" />
                      <div>
                        <h3 className="font-medium">Discord</h3>
                        <p className="text-muted-foreground text-sm">
                          Login with your Discord account
                        </p>
                      </div>
                    </div>
                    <div>
                      {profileData.accounts.some(
                        (account) => account.provider === "discord",
                      ) ? (
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
                          {/* <Link href="/api/auth/signin?provider=discord&callbackUrl=/account">
                            Connect
                            </Link> */}
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password & Security
                </CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasCredentialsAccount ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
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
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
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
                      {changePassword.isPending
                        ? "Updating..."
                        : "Update Password"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Password Set</AlertTitle>
                      <AlertDescription>
                        {`You don't have a password set for your account. You can add one from the
                        Linked Accounts tab.`}
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={() => {
                        const tabsList =
                          document.querySelector('[role="tablist"]');
                        const linkedAccountsTab = tabsList?.querySelector(
                          '[value="linked-accounts"]',
                        );
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
