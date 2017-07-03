# ionic-sqlite-orm

This a a light-weight ORM for ionic 2 using native SQLITE 
plugin for cordova and WebSQL for browser support. This
package is using SqlDatabase (https://github.com/mirkonasato/ionix-sqlite)
as dependency. Thanks to mirkonasato for support.

---
**Installation**
-
npm i ionic-sqlite-orm

***How to use***
-
You need to first create a model which will extends to QueryBuilder.
for example :- post.model.ts

import {BaseModel} from "../services/query-builder";

---
create model first
---

```
export class PostModel extends BaseModel {
    public database: string = 'exampleDatabase.db';
    public table: string = 'posts';
    public schema: Object = {
        id: 'INTEGER(11) PRIMARY KEY',
        title: 'VARCHAR(255)',
        description: 'TEXT',
        keywords: 'TEXT',
        parent_category_id: 'INTEGER(11)',
        category_id: 'INTEGER(11)',
        cover: 'VARCHAR(255)',
        created_at: 'DATETIME',
        updated_at: 'DATETIME',
        status: 'INTEGER(1)'
    }
}
```

```
var posts = new QueryBuilder(new PostModel());

var category_id = 5;
var limit = 50;
var start = 0;

var results = posts.where("id", "=", category_id).orderBy("created_at", "DESC").limit(limit, start).get();
```

---
Query Builder methods
---

1) get()
2) delete()
3) create()
4) first()
5) where()
6) orWhere()
7) update()
8) updateOrcreate()

Sorry, npm installation not working right now, somehow. however you can Download query-builder.ts manually and put into service folder, make sure to install dependency from https://github.com/mirkonasato/ionix-sqlite.

npm install --save ionix-sqlite

