'use client'

import { motion } from 'framer-motion'
import { AsyncButton, type AsyncButtonProps } from './async-button'
import { buttonVariants } from '@/lib/utils/animations'

interface AnimatedButtonProps extends AsyncButtonProps {
  enableAnimation?: boolean
}

export const AnimatedButton = ({ enableAnimation = true, ...props }: AnimatedButtonProps) => {
  if (!enableAnimation) {
    return <AsyncButton {...props} />
  }

  return (
    <motion.div
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      transition={{ duration: 0.15 }}
    >
      <AsyncButton {...props} />
    </motion.div>
  )
}
