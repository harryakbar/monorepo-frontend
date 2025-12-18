import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@repo/ui";

const meta = {
  title: "Example/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    color: { control: "color" },
  },
  args: {},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: "Label",
  },
};

export const Secondary: Story = {
  args: {
    label: "Label",
  },
};

export const Large: Story = {
  args: {
    label: "Label",
  },
};

export const Small: Story = {
  args: {
    label: "Label",
  },
};
