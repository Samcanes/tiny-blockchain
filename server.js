const sha256 = require('js-sha256')
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var mongo = require('mongodb');
var mongoose = require('mongoose');
app.use(cors())
app.set('view engine', 'ejs');

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render(__dirname + '/views/index.ejs')
});
app.get('/transaction', (req, res) => {
    res.render(__dirname + '/views/transaction.ejs')
});


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log(`connection to database established`)
}).catch(err => {
    console.log(`db error ${err.message}`);
    process.exit(-1)
});



let newBlockSchema = new mongoose.Schema({
    index: {
        type: Number,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    },
    data: {
        type: String,
        required: true
    },
    prevHash: {
        type: String,
        required: true
    },
    thisHash: {
        type: String,
        required: true
    },
})
let BlockModel = mongoose.model('BlockModel', newBlockSchema)



const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})


class Block {
    constructor(index, timestamp, data, prevHash) {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.prevHash = prevHash;
        this.thisHash = sha256(
            this.index + this.timestamp + this.data + this.prevHash
        );
    }
}

const nextBlock = (lastBlock, data) =>
    new Block(lastBlock.index + 1, Date.now(), data, lastBlock.thisHash);



const createBlockchain = (data, chain) => {
    console.log("Chain: ", chain)
    chain.reverse();
    const blockchain = chain;

    let previousBlock = blockchain[chain.length - 1];
    console.log("previousBlock: ", previousBlock)

    const blockToAdd = nextBlock(previousBlock, data);
    console.log("blockToAdd: ", blockToAdd)

    blockchain.push(blockToAdd);
    console.log("blockchain: ", blockchain)

    previousBlock = blockToAdd;
    console.log("previousBlock: ", previousBlock)

    let newBlock = new BlockModel(blockchain[blockchain.length - 1])
    console.log("last: ", blockchain[blockchain.length - 1])
    console.log("last: ", newBlock)
    newBlock.save((err, savedUser) => {
        if (err) {
            // if we get error while adding log it.
            console.log(err)
        } else {
            //no error
            console.log("no error. Sending response...")
                // response.json(savedUser)
        }
    })
};


let bodyParser = require('body-parser');


app.post('/api/blockchain/new-block',
    bodyParser.urlencoded({
        extended: false
    }),
    (req, res) => {
        //getting input user-id
        let inputAmount = req.body.blockAmount,
            inputData = req.body.blockData;
        console.log(inputAmount, inputData)

        let blockCount = 1
        BlockModel.find({})
            .sort({
                index: 'desc'
            })
            .exec((err, result) => {
                //console.log(result)
                //console.log(result.length)
                if (result.length == 0) {
                    let newBlock = new BlockModel(new Block(0, Date.now(), 'Genesis Block', '0'))
                    newBlock.save((err, savedUser) => {
                        if (err) {
                            // if we get error while adding log it.
                            console.log(err)
                        } else {
                            // no error 
                            console.log("no error. Sending response...")
                                //res.json(savedUser)
                        }
                    })
                    res.send("Jus Created Genesis block. U need to enter data again to create second block")
                } else {

                    //console.log(result)
                    createBlockchain(inputData, result);
                    res.redirect("/api/blockchain/logs")
                }
            })
    }
)


app.get('/api/blockchain/logs', (req, res) => {
    BlockModel.find({})
        .sort({
            date: 'desc'
        })
        .exec((err, receivedObject) => {
            if (err) {
                console.log(err)
            } else {
                //console.log(receivedObject)
                var items = receivedObject
                console.log(items)
                res.render(__dirname + '/views/transacationList.ejs', {
                    links: items
                })
            }
        })
})