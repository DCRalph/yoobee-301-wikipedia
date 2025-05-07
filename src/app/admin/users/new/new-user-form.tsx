"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import { Role } from "@prisma/client";

interface NewUserFormData {
  name: string;
  email: string;
  role: Role;
}

type FormChangeEvent =
  | React.ChangeEvent<HTMLInputElement>
  | { name: keyof NewUserFormData; value: string };

export function NewUserForm() {
  const [formData, setFormData] = useState<NewUserFormData>({
    name: "",
    email: "",
    role: "USER",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewUserFormData, string>>
  >({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof NewUserFormData, string>> = {};

    if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // TODO: Implement user creation API call
      console.log(formData);
      toast.success("User created successfully");
    } catch {
      toast.error("Failed to create user");
    }
  };

  const handleChange = (e: FormChangeEvent) => {
    const name =
      "target" in e ? (e.target.name as keyof NewUserFormData) : e.name;
    const value = "target" in e ? e.target.value : e.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-muted-foreground">Add a new user to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleChange({ name: "role", value })}
          >
            <SelectTrigger className={errors.role ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Role).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
        </div>

        <Button type="submit">Create User</Button>
      </form>
    </div>
  );
}
