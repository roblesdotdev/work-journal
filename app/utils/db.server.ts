import { PrismaClient } from '@prisma/client'

function singleton<Value>(name: string, value: () => Value): Value {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yolo = global as any
  yolo.__singletons ??= {}
  yolo.__singletons[name] ??= value()
  return yolo.__singletons[name]
}

export const db = singleton('prisma', () => new PrismaClient())
