import { Menu } from '@mui/icons-material';
import type { IconButtonProps } from '@mui/material/IconButton';
import IconButton from '@mui/material/IconButton';
import { useThemedLayoutContext } from '@refinedev/mui';
import type { FC } from 'react';

const HamburgerIcon = (props: IconButtonProps) => (
  <IconButton color="inherit" aria-label="open drawer" edge="end" {...props}>
    <Menu />
  </IconButton>
);

export const HamburgerMenu: FC = () => {
  const {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    siderCollapsed,
    setSiderCollapsed,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext();

  return (
    <>
      <HamburgerIcon
        onClick={() => setSiderCollapsed(!siderCollapsed)}
        sx={{
          mr: 2,
          display: { xs: 'none', md: 'flex' },
          ...(!siderCollapsed && { display: 'none' }),
        }}
      />
      <HamburgerIcon
        onClick={() => setMobileSiderOpen(!mobileSiderOpen)}
        sx={{
          display: { xs: 'flex', md: 'none' },
        }}
      />
    </>
  );
};
