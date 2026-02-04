import React from "react";

export interface BadgeProps {
  variant?: "gray" | "red" | "yellow" | "green" | "blue";
  size?: "sm" | "md" | "lg";
  label: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = "gray", 
  size = "md", 
  label,
  className = "",
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-full border";
  
  const variantStyles = {
    gray: "bg-gray-50 border-gray-300 text-gray-700",
    red: "bg-pink-50 border-pink-300 text-red-700",
    yellow: "bg-yellow-50 border-yellow-300 text-orange-700",
    green: "bg-green-50 border-green-300 text-green-700",
    blue: "bg-blue-50 border-blue-300 text-blue-700",
  };
  
  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };
  
  const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();
  
  return (
    <span className={classes} {...props}>
      {label}
    </span>
  );
};
