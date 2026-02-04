import { Badge } from "@repo/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["gray", "red", "yellow", "green", "blue"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gray: Story = {
  args: {
    variant: "gray",
    label: "Label",
  },
};

export const Red: Story = {
  args: {
    variant: "red",
    label: "Label",
  },
};

export const Yellow: Story = {
  args: {
    variant: "yellow",
    label: "Label",
  },
};

export const Green: Story = {
  args: {
    variant: "green",
    label: "Label",
  },
};

export const Blue: Story = {
  args: {
    variant: "blue",
    label: "Label",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    variant: "gray",
    label: "Label",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    variant: "gray",
    label: "Label",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    variant: "gray",
    label: "Label",
  },
};

export const AllVariants: Story = {
  args: {
    label: "Label",
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Badge variant="gray" label="Label" size="sm" />
        <Badge variant="gray" label="Label" size="md" />
        <Badge variant="gray" label="Label" size="lg" />
      </div>
      <div className="flex gap-2">
        <Badge variant="red" label="Label" size="sm" />
        <Badge variant="red" label="Label" size="md" />
        <Badge variant="red" label="Label" size="lg" />
      </div>
      <div className="flex gap-2">
        <Badge variant="yellow" label="Label" size="sm" />
        <Badge variant="yellow" label="Label" size="md" />
        <Badge variant="yellow" label="Label" size="lg" />
      </div>
      <div className="flex gap-2">
        <Badge variant="green" label="Label" size="sm" />
        <Badge variant="green" label="Label" size="md" />
        <Badge variant="green" label="Label" size="lg" />
      </div>
      <div className="flex gap-2">
        <Badge variant="blue" label="Label" size="sm" />
        <Badge variant="blue" label="Label" size="md" />
        <Badge variant="blue" label="Label" size="lg" />
      </div>
    </div>
  ),
};

