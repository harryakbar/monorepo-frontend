import { Button } from "@repo/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { fn } from "storybook/test";

const ArrowIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Explore products",
    icon: <ArrowIcon />,
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Explore products",
    icon: <ArrowIcon />,
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Remove item",
    icon: <TrashIcon />,
  },
};

export const WithLeftIcon: Story = {
  args: {
    variant: "primary",
    children: "Explore products",
    icon: <ArrowIcon />,
    iconPosition: "left",
  },
};

export const WithoutIcon: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    variant: "primary",
    children: "Small Button",
    icon: <ArrowIcon />,
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    variant: "primary",
    children: "Medium Button",
    icon: <ArrowIcon />,
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    variant: "primary",
    children: "Large Button",
    icon: <ArrowIcon />,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    variant: "primary",
    children: "Disabled Button",
    icon: <ArrowIcon />,
  },
};

