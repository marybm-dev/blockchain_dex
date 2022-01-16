import { tokens, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Token', ([deployer, receiver, exchange]) => {
    const name = 'Queer Token'
    const symbol = 'QUEER'
    const decimals = '18'
    const totalSupply = tokens(69420000).toString()

    let token

    beforeEach(async () => {
        // fetch token from blockchain
        token = await Token.new()
    })

    describe('deployment', () => {
        it('tracks the name', async () => {
            // read token name here
            const result = await token.name()
            // check the token name is 'My Name'
            result.should.equal(name)
        })

        it('tracks the symbol', async() => {
            const result = await token.symbol()
            result.should.equal(symbol)
        })

        it('tracks the decimals', async() => {
            const result = await token.decimals()
            result.toString().should.equal(decimals)
        })

        it('tracks the total supply', async() => {
            const result = await token.totalSupply()
            result.toString().should.equal(totalSupply.toString())
        })

        it('assings the totaly supply of deployer', async() => {
            const result = await token.balanceOf(deployer)
            result.toString().should.equal(totalSupply.toString())
        })
    })

    describe('sending tokens', () => {
        let amount
        let result

        describe('success', async () => {
            beforeEach(async () => {
                amount = tokens(10000)
                result = await token.transfer(receiver, amount, { from: deployer })
            })

            it('transfer token balances', async() => {
                let balanceOf
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(69410000).toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(10000).toString())
            })

            it('emits a Transfer event', async() => {
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.equal(deployer, 'from is correct')
                event.to.should.equal(receiver, 'to is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async () => {
            beforeEach(async () => {

            })

            it('rejects insufficient balances', async() => {
                let invalidAmount
                invalidAmount = tokens(100000000) // 100M > totalSupply
                await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT);

                // attempt token transfers when you have none
                invalidAmount = tokens(10)
                await token.transfer(deployer, invalidAmount, { from: receiver }).should.be.rejectedWith(EVM_REVERT);
            })

            it('rejects invalid recipients', async() => {
                await token.transfer(0x0, amount, { from: deployer }).should.be.rejected;
            })
        })
    })

    describe('approving tokens', () => {
        let result
        let amount

        beforeEach(async () => {
            amount = tokens(100)
            result = await token.approve(exchange, amount, { from: deployer });
        })

        describe('success', () => {
            it('allocates an allowance for delegated token spending', async () => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal(amount.toString())
            })

            it('emits an Approval event', async() => {
                const log = result.logs[0]
                log.event.should.eq('Approval')
                const event = log.args
                event.owner.toString().should.equal(deployer, 'owner is correct')
                event.spender.should.equal(exchange, 'spender is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })

        describe('failure', () => {
            it('rejects invalid recipients', async() => {
                await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
            })
        })
    })

    describe('delegated token transfers', () => {
        let amount
        let result

        beforeEach(async () => {
            amount = tokens(10000)
            await token.approve(exchange, amount, { from: deployer })
        })

        describe('success', async () => {
            beforeEach(async () => {
                result = await token.transferFrom(deployer, receiver, amount, { from: exchange })
            })

            it('transfer token balances', async() => {
                let balanceOf
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(69410000).toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(10000).toString())
            })

            it('resets the allowance', async() => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal('0')
            })

            it('emits a Transfer event', async() => {
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.equal(deployer, 'from is correct')
                event.to.should.equal(receiver, 'to is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async () => {
            it('rejects insufficient balances', async() => {
                let invalidAmount
                invalidAmount = tokens(100000000) // 100 mil > totalSupply
                await token.transferFrom(deployer, receiver, invalidAmount, { from: exchange }).should.be.rejectedWith(EVM_REVERT)
            })

            it('rejects invalid recipients', async() => {
                await token.transferFrom(deployer, 0x0, amount, { from: exchange }).should.be.rejected
            })
        })
    })
})