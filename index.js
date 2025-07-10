const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r6nxx1r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const productsCollection = client.db('easyBuyDB').collection('products');
    const addToCartCollection = client.db('easyBuyDB').collection('addProducts');

    // products api
    app.get('/products', async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result)
    })
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result)
    })

    // Add to cart api

    app.post('/addedProducts', async (req, res) => {
      const { productId } = req.body;

      const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const existingCartItem = await addToCartCollection.findOne({ productId: productId });

      if (existingCartItem) {
        const updated = await addToCartCollection.updateOne(
          { productId: productId },
          { $inc: { quantity: 1 } }
        );
        res.send({ message: 'Quantity increased', updated });
      } else {

        const cartItem = {
          productId: productId,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: 1,
        };
        const result = await addToCartCollection.insertOne(cartItem);
        res.send({ message: 'Product added to cart', result });
      }
    });

    app.get('/addedProducts', async (req, res) => {
      const result = await addToCartCollection.find().toArray();
      res.send(result)
    })

    app.delete('/addedProducts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addToCartCollection.deleteOne(query);
      res.send(result);
    })

    app.put('/addedProducts/:id', async (req, res) => {
      const id = req.params.id;
      const updatedCart = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          quantity: updatedCart.quantity
        }
      };
      const result = await addToCartCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
