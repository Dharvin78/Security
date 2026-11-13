/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import {
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  DataTypes,
  type Sequelize
} from 'sequelize'
import { encryptData, decryptData } from '../lib/dataEncryption'

class Address extends Model<
InferAttributes<Address>,
InferCreationAttributes<Address>
> {
  declare UserId: number
  declare id: CreationOptional<number>
  declare fullName: string
  declare mobileNum: number
  declare zipCode: string
  declare streetAddress: string
  declare city: string
  declare state: string | null
  declare country: string
}

const AddressModelInit = (sequelize: Sequelize) => {
  Address.init(
    {
      UserId: {
        type: DataTypes.INTEGER
      },
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fullName: {
	type: DataTypes.TEXT,
  	set (value: string) {
          this.setDataValue('fullName', encryptData(value))
        },
        get () {
          const stored = this.getDataValue('fullName')
          return stored == null ? stored : decryptData(stored)
        }
      },
      mobileNum: {
        type: DataTypes.TEXT,
         validate: {
           validMobileNumber (this: Address) {
             const value = this.mobileNum

             if (!Number.isInteger(value) ||
                 value < 1000000 ||
                 value > 9999999999) {
               throw new Error('Invalid mobile number')
             }
           }
         },
         set (value: number) {
           this.setDataValue(
             'mobileNum',
             encryptData(String(value)) as unknown as number
           )
         },
         get () {
           const stored = this.getDataValue('mobileNum')
           return stored == null ? stored : Number(decryptData(String(stored)))
         }
      },

      zipCode: {
        type: DataTypes.STRING,
        validate: {
          len: [1, 8]
        }
      },
      streetAddress: {
        type: DataTypes.TEXT,
        validate: {
          validStreetAddress (this: Address) {
            const value = this.streetAddress

            if (typeof value !== 'string' ||
                value.length < 1 ||
                value.length > 160) {
              throw new Error('Street address must contain 1–160 characters')
            }
          }
        },
        set (value: string) {
          this.setDataValue('streetAddress', encryptData(value))
        },
        get () {
          const stored = this.getDataValue('streetAddress')
          return stored == null ? stored : decryptData(stored)
        }
      },
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      country: DataTypes.STRING
    },
    {
      tableName: 'Addresses',
      sequelize
    }
  )
}

export { Address as AddressModel, AddressModelInit }
