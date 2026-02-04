import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  icon,
  iconPosition = "right",
  className = "",
  ...props
}) => {
  const baseStyles = "font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2";
  
  const variantStyles = {
    primary: "bg-[#6366f1] text-white hover:bg-[#4f46e5] focus:ring-[#6366f1] active:bg-[#4338ca]",
    secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 active:bg-gray-100",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 active:bg-blue-100",
    ghost: "text-blue-600 hover:bg-blue-50 focus:ring-blue-500 active:bg-blue-100",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800",
  };
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();
  
  const iconElement = icon && (
    <span className={size === "sm" ? "w-4 h-4" : size === "lg" ? "w-5 h-5" : "w-4 h-4"}>
      {icon}
    </span>
  );
  
  return (
    <button className={classes} {...props}>
      {icon && iconPosition === "left" && iconElement}
      {children}
      {icon && iconPosition === "right" && iconElement}
    </button>
  );
};

