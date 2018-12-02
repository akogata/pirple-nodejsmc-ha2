# pirple-nodejsmc-ha2 

## How to Turn It In:

1. Create a public github repo for this assignment. 

2. Create a new post in the [Facebook Group](https://www.facebook.com/groups/1282717078530848/)  and note "Homework Assignment #2" at the top.

3. In that thread, discuss what you have built, and include the link to your Github repo. 

## The Assignment (Scenario):

You are building the **API** for a pizza-delivery company. Don't worry about a frontend, just build the API. Here's the spec from your project manager:

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.

2. Users can log in and log out by creating or destroying a token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system). 

4. A logged-in user should be able to fill a shopping cart with menu items

5. A logged-in user should be able to create an order. You should integrate with the Sandbox of [Stripe.com](https://stripe.com/) to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: [https://stripe.com/docs/testing#cards](https://stripe.com/docs/testing#cards)

6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of [Mailgun.com](http://mailgun.com/) for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task [https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account](https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account)

**Important Note:** If you use external libraries (NPM) to integrate with Stripe or Mailgun, you will not pass this assignment. You must write your API calls from scratch. Look up the "Curl" documentation for both APIs so you can figure out how to craft your API calls. 

This is an open-ended assignment. You may take any direction you'd like to go with it, as long as your project includes the requirements. It can include anything else you wish as well. 

**P.S. Don't forget to document how a client should interact with the API you create!**

# Answer program

## Implementation

There are 3 entities handled by this API:
- users;
- tokens;
- orders;

Users and tokens are backed by a database and show no surprises. There are methods to
create/update/delete them. No list method is available for them, though.
To handle the orders, there's no dedicated 'table' for that. An extra field (slices) in user data 
is used to hold the order being placed. So 'PUT' requests on 'users' can update the current state
of the users's order. And 'GET' requests on 'orders' can show how much the order amounts.
To place the order, one can use a 'POST' request on 'orders'. The slices field is reset to empty after
the payment is placed and an email is sent to the user.
In this implementation, one can order a single slice of a pizza. The frontend could apply some constraints
so that only multiples of 8 would be allowed. Or at least 4 slices of the same flavor could be.

The **menu** is a plain json file at ./.data/menu/menu.json:
```
{
	"1":{"flavor":"Margherita","value":1.5},
	"2":{"flavor":"Funghi","value":1.75},
	"3":{"flavor":"Peperoni","value":2.15},
	"4":{"flavor":"Napolitana","value":1.5},
	"5":{"flavor":"Hawaii","value":2.25},
	"6":{"flavor":"Calzone","value":3},
	"7":{"flavor":"Rucola","value":1.5},
	"8":{"flavor":"Bolognese","value":3.5},
	"9":{"flavor":"Mexicana","value":3}
}
```
Each entry has a tuple flavor/value. It is not possible to edit it using this API.

## Secret data

At first, sensitive data from Stripe and Mailgun accounts were stored at ./config.js. Then, it was
changed to environment variables so there's no keep them in github.

## How to test

Using curl:

```
URL=http://localhost:3000

# create the user
curl -X POST ${URL}/users -d '{"email":"a@b.com","password":"aPassword","name":"john","address":"john address"}'

# create a token id for next requests
curl -X POST ${URL}/tokens -d '{"email":"a@b.com","password":"aPassword"}'

token="" # save the token

# check the user data
curl -X GET ${URL}/users?email=a@b.com -H token:$token

# get the pizza menu
curl -X GET ${URL}/menu?email=a@b.com -H token:$token

# choose some slices
curl -X PUT ${URL}/users -H token:$token -d '{"email":"a@b.com",slices=[2,2,2,2,3,3,3,3]}'

# check the user data
curl -X GET ${URL}/users?email=a@b.com -H token:$token

# check how much will it cost
curl -X GET ${URL}/orders?email=a@b.com -H token:$token

# if thats ok, proceed to place the order
curl -X POST ${URL}/orders -d '{"email":"a@b.com"} -H token:$token
```


## API

### Users

New users are added by calling POST with the required fields. 'email' is used as key.
PUT is used 

| Method | Description | Payload | Headers | Queryparam | Outcome |
|----------|---------------------------|--------------------------------------------------------------------|---------|-------------|--------------------|
| POST | Add a new user | email, password, name, address | none | none | user JSON |
| GET | Get user data | none | token | id | user JSON |
| PUT | Update user data| email, [password, name, address, slices] | token | none | user JSON |
| DELETE | Remove user from database | email | token | none | none |


### Tokens

| Method | Description | Payload | Headers | Queryparam | Outcome |
|----------|---------------------------|--------------------------------------------------------------------|---------|-------------|--------------------|
| POST | Add a new token | email, password | none | none | token JSON |
| GET | Get token data | none | none | id | token JSON |
| PUT | Extend token by 1h from now | id, extend | token | none | token JSON |
| DELETE | Remove token from database | id | token | none | none |

### Menu

| Method | Description | Payload | Headers | Queryparam | Outcome |
|----------|---------------------------|--------------------------------------------------------------------|---------|-------------|--------------------|
| GET | Get menu options | none | token | email | menu JSON |

### Orders

| Method | Description | Payload | Headers | Queryparam | Outcome |
|----------|---------------------------|--------------------------------------------------------------------|---------|-------------|--------------------|
| GET | Get the current amount if an order was placed | none | token | email | order JSON |
| POST | Place an order | email | token | none | order JSON |