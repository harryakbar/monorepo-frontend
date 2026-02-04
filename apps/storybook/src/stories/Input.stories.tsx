import { Input } from "@repo/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
);

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const Email: Story = {
  args: {
    label: "Email",
    type: "email",
    placeholder: "example@example.com",
  },
};

export const EmailFilled: Story = {
  args: {
    label: "Email",
    type: "email",
    defaultValue: "johnappleseed@mail.com",
  },
};

export const EmailRequired: Story = {
  args: {
    label: "Email",
    type: "email",
    error: "Email is required.",
  },
};

export const EmailInvalid: Story = {
  args: {
    label: "Email",
    type: "email",
    defaultValue: "invalid-email",
    error: "Please enter a valid email address",
  },
};

export const Password: Story = {
  args: {
    label: "Password",
    type: "password",
    defaultValue: "********",
    showPasswordToggle: true,
  },
};

export const PasswordVisible: Story = {
  args: {
    label: "Password",
    type: "password",
    defaultValue: "12345678",
    showPasswordToggle: true,
  },
};

export const PasswordError: Story = {
  args: {
    label: "Password",
    type: "password",
    defaultValue: "**********",
    showPasswordToggle: true,
    error: "Password should contain at least 8 characters, one uppercase, one lowercase, and one number",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Username",
    placeholder: "Enter username",
    helperText: "Choose a unique username for your account",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Input",
    placeholder: "This input is disabled",
    disabled: true,
    defaultValue: "Cannot edit this",
  },
};

