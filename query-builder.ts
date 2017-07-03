import {Injectable} from '@angular/core';
import {SqlDatabase} from "ionix-sqlite";

@Injectable()
export class BaseModel {
    //
}

@Injectable()
export class QueryBuilder {
    private _database: Promise<SqlDatabase>;
    private _table: BaseModel;
    private _where: Array<any> = [];
    private _limit: number = null;
    private _skip: number = null;
    private _order: Array<any> = [];
    private _showQuery: boolean = false;

    constructor(public baseModel: BaseModel) {
        this._initDataBase(baseModel);
    }

    showQuery() {
        return this._showQuery = true;
    }

    create(items: Object): Promise<any> {
        var items_mark = [];
        var items_key = [];
        var items_value = [];

        for (var item in items) {
            items_mark.push("?");
            items_key.push(item);
            items_value.push(items[item]);
        }

        var query = `INSERT INTO ${this._table} (${items_key.join(", ")}) VALUES (${items_mark.join(", ")})`;
        return new Promise((resolve, reject) => {
            this._query(query, items_value).then((response: any) => {
                resolve("created");
            }, (error)=> {
                reject(error);
            });
        });
    }

    update(items: Object): Promise<any> {
        var updateQuery = [];
        for (var item in items) {
            updateQuery.push(`${item}='${items[item]}'`);
        }

        var query = `UPDATE ${this._table} SET ${updateQuery.join(", ")} ${this._buildWhereQuery()}`;
        return new Promise((resolve, reject) => {
            this._query(query, []).then((response: any) => {
                resolve("updated");
            }, (error)=> {
                reject(error);
            });
        });
    }

    updateOrCreate(items: Object): Promise<any> {
        var query = `SELECT * FROM ${this._table} ${this._buildWhereQuery()}`;

        return new Promise((resolve, reject) => {
            this._query(query, []).then((response: any)=> {
                var result = this._filterQueryToArray(response)

                if (result.length) {
                    this.update(items).then(data => {
                        resolve(data);
                    }, (error)=> {
                        reject(error);
                    });
                }

                if (!result.length) {
                    this.create(items).then(data => {
                        resolve(data);
                    }, (error)=> {
                        reject(error);
                    });
                }
            });
        });
    }

    first(items: string = "*"): Promise<any> {
        return new Promise((resolve, reject) => {
            var query = `SELECT ${items} FROM ${this._table} ${this._buildWhereQuery()} ${this._buildOrderByQuery()} LIMIT 1`;
            this._query(query, []).then((response: any)=> {
                resolve(response.rows.length ? response.rows.item(0) : null);
            }, (error)=> {
                reject(error);
            });
        });
    }

    get(items: string = "*"): Promise<any> {
        return new Promise((resolve, reject) => {
            var total = `SELECT ${items} FROM ${this._table} ${this._buildWhereQuery()}`;
            this._query(total, []).then((total: any)=> {
                var query = `SELECT ${items} FROM ${this._table} ${this._buildWhereQuery()} ${this._buildOrderByQuery()} ${this._buildTakeQuery()}`;
                this._query(query, []).then((response: any)=> {
                    resolve({
                        total: total.rows.length,
                        results: this._filterQueryToArray(response)
                    });
                }, (error)=> {
                    reject(error);
                });
            }, (error)=> {
                reject(error);
            });
        });
    }

    delete(): Promise<any> {
        var query = `DELETE FROM ${this._table} ${this._buildWhereQuery()}`;

        return new Promise((resolve, reject)=> {
            this._query(query, []).then((response: any)=> {
                resolve(response);
            }, (error)=> {
                reject(error);
            });
        });
    }

    rawQuery(query, options: Array<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            this._query(query, options).then((response: any)=> {
                var data = this._filterQueryToArray(response);
                // resolving results
                resolve(data);
            }, (error)=> {
                reject(error)
            });
        });
    }

    limit(limit: number, skip: number): any {
        this._limit = limit;
        this._skip = skip;

        return this;
    }

    orderBy(key: any, value: any): any {
        if (key && value) {
            this._order.push(key + ' ' + value);
        }

        return this;
    }

    where(key: string, seperator: string, value: any): any {
        var type = (this._where.length) ? " AND" : "";

        var condition = `${type} ${key} ${seperator} '${value}'`;
        this._where.push(condition);

        return this;
    }

    orWhere(key: string, seperator: string, value: any): any {
        var type = (this._where.length) ? " OR" : "";

        var condition = `${type} ${key} ${seperator} '${value}'`;
        this._where.push(condition);

        return this;
    }

    private _query(query, options: Array<any>): any {
        var newQuery = query.replace(/  +/g, ' ');

        if (this._showQuery) console.log(newQuery);

        return new Promise((resolve, reject)=> {
            this._database.then(db => {
                db.execute(newQuery, options).then((response: any) => {
                    resolve(response);
                }, (error)=> {
                    reject(error);
                });
            });
        });
    }

    private _filterQueryToArray(response) {
        var data = [];
        for (var i = 0; i < response.rows.length; i++) {
            data.push(response.rows.item(i));
        }

        return data;
    }

    private _initDataBase(baseModel) {
        if (baseModel == null) return;

        var migration = [];
        for (var i in baseModel.schema) {
            migration.push(`${i} ${baseModel.schema[i]}`);
        }
        var schemaQuery = `CREATE TABLE IF NOT EXISTS ${baseModel.table} (${migration.join(", ")})`;

        this._table = baseModel.table;
        this._database = SqlDatabase.open(baseModel.database, [schemaQuery]);

        return this;
    }

    private _buildOrderByQuery() {
        var order = '';

        if (this._order.length) {
            this._order.forEach((value, index) => {
                order = order + ` ORDER BY ${value}`;

                if (this._order.length > index + 1) {
                    order = order + ` , `;
                }
            });
        }

        return order;
    }

    private _buildWhereQuery() {
        var wcs: string = '';
        if (this._where.length) {
            wcs = 'WHERE ';
            this._where.forEach((value, index) => {
                if (index > 0) {
                    wcs = wcs;
                }
                wcs = wcs + value;
            });
        }

        return wcs;
    }

    private _buildTakeQuery() {
        var q = '';

        if (this._limit && this._skip) {
            q = ` LIMIT ${this._limit} OFFSET ${this._skip}`
        }

        if (this._limit && !this._skip) {
            q = ` LIMIT ${this._limit}`
        }

        return q;
    }
}