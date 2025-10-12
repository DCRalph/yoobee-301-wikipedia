/**
 * Integration test example for the `home` router
 */

import { describe, it, expect } from 'vitest'
import { createCaller } from '~/server/api/root'
import { db } from '~/server/db'

const ctx = {
  headers: new Headers(),
  db: db,
  session: null,
}

describe('Home API', () => {
  it('should pass basic test', async () => {
    
    const caller = createCaller(ctx)
    const home = await caller.home.getDailyContent()

    console.log(home)

    expect(true).toBe(true)
  })


})