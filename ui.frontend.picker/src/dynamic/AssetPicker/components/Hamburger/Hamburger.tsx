import { FC } from "react";

import classNames from "classnames";

import styles from "./Hamburger.module.scss";

export type HamburgerProps = {
  isNavigationOpen: boolean;
  toggleNavigation: () => void;
};

export const Hamburger: FC<HamburgerProps> = ({ isNavigationOpen, toggleNavigation }) => {
  return (
    <button
      type="button"
      className={classNames(styles.hamburger, {
        [styles.open]: isNavigationOpen,
      })}
      onClick={toggleNavigation}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
};
