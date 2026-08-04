import { ButtonHTMLAttributes, FC, MouseEvent, PropsWithChildren } from "react";

import classNames from "classnames";

import styles from "./Button.module.scss";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  size?: "small" | "large";
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

export const Button: FC<PropsWithChildren<ButtonProps>> = ({
  children,
  className,
  size = "large",
  type = "button",
  onClick,
  ...attributes
}) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
  };

  return (
    <button
      {...attributes}
      type={type}
      className={classNames(styles.button, className, {
        [styles.small]: size === "small",
      })}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
