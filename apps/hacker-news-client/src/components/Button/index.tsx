interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "disabled";
  onClick: () => void;
}

interface LinkProps extends ButtonProps {
  href: string;
  variant?: "primary" | "disabled";
}

export const Button = ({
  children,
  variant,
  onClick,
}: ButtonProps): React.ReactElement => {
  let classNames = "";
  if (variant === "primary") {
    classNames =
      "bg-orange-600 text-white hover:bg-orange-800 focus:bg-orange-800 shadow-md outline-0";
  } else if (variant === "secondary") {
    classNames =
      "bg-white text-neutral-950 border border-neutral-400 hover:bg-neutral-50 hover:bg-neutral-50 shadow-md outline-0";
  } else if (variant === "disabled") {
    classNames = "bg-neutral-200 text-neutral-400";
  }

  return (
    <button className={classNames} onClick={onClick}>
      {children}
    </button>
  );
};

export const Link = ({
  children,
  variant,
  href,
}: LinkProps): React.ReactElement => {
  let classNames = "";
  if (variant === "primary") {
    classNames =
      "text-orange-600 hover:text-orange-800 focus:text-orange-800 outline-2";
  } else if (variant === "disabled") {
    return (
      <span className="text-neutral-400 hover:text-neutral-400 focus:text-neutral-400 cursor-not-allowed">
        {children}
      </span>
    );
  }

  return (
    <a className={classNames} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
};

export const IconLink = ({
  children,
  variant,
}: ButtonProps): React.ReactElement => {
  let classNames = "";
  if (variant === "primary") {
    classNames =
      "bg-orange-600 text-white hover:bg-orange-800 outline-none focus:bg-orange-800";
  }

  return <button className={classNames}>{children}</button>;
};
