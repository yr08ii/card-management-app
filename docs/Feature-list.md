# Definitions
According to the Pismo Development Documentation

## Account
An account is the foundational object for all financial operations. It's what transactions, fees, payments, and so on are all attached to. The ledger is based on it.
An account can have multiple customers, such as joint checking accounts and credit cards that share the account balance.

Every account is required to have at least one customer.
A customer can be classified as either a person or a company.
When an account is initially created, it is established with either a person or company object, which represents the initial customer and designated owner.

## The Customer-Account Dynamic
An account can have multiple customers (e.g., joint accounts, shared credit cards).
A customer can have multiple accounts also. For example, a person may have an account associated with a corporate credit card and another account associated with a debit card.
Additional customers are added with a customer object. The person and company objects include many fields not included in the customer object".

## Account Hierarchies
You can define a parent and child relationship between accounts. A parent account can have multiple child accounts... 
All child and grandchild accounts connect to the main parent account.

# App Features
There should be a different feature set list per user type.
One general app that accommodates different management options depending on the login details.

## Flow
When logging in the idea is to sign in with your own user credentials.
Based on your user you might be the costumer of different accounts.
And that will dictate whether you have access to a shared credit card for an account for example, or if you manage that account in general.
Example: Apple has an account with Chan Taiman as a costumer. Chan Taiman works as a driver for Apple product shipment trucks. Chan Taiman logs in and is able to view information about a credit card that the Apple management has created for the drivers team, and therefore pay toll gate cost fees.
Now there is another user which is Mr. Zhang and he is also a costumer but his user token's scope is larger so it allows you to view all cards issued by Apple as a company and review all transactions and add or remove costumers from specific cards.
Same App but one's credentials allow him to get only and another's to post and patch as well.
So this card management app must allow at most this much level of control, and at least, allow a user to view the cvv and pan.
It does not allow users to make transactions with the app yet, unless they put it in Apple Pay and so on, like an actual bank app.

## User Permissions:
**...:** 
**...:** 
