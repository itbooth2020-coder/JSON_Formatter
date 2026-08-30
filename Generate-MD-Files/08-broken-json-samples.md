# Mid-Size Intentionally Broken JSON Samples

This file contains intentionally invalid JSON samples for testing a JSON formatter, validator, parser, JSON diff tool, and error-highlighting UI.

> **Important:** Every sample below is intentionally broken. Do not treat these examples as valid JSON.

---

## 1. Missing Comma JSON

```json
{
  "user": {
    "id": 1001,
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
    "role": "admin",
    "active": true
  },
  "permissions": [
    "read",
    "write",
    "delete"
  ]
}
```

**Expected error:** Missing comma after `"email"`.

---

## 2. Missing Closing Bracket JSON

```json
{
  "company": "TechNova",
  "employees": [
    {
      "id": 101,
      "name": "Amit",
      "department": "Engineering"
    },
    {
      "id": 102,
      "name": "Priya",
      "department": "Product"
    },
    {
      "id": 103,
      "name": "Vikram",
      "department": "Finance"
    }
  ,
  "location": "Bengaluru"
}
```

**Expected error:** Broken array/object structure; closing delimiters are incorrect.

---

## 3. Single Quotes JSON

```json
{
  'id': 1001,
  'name': 'John Doe',
  'email': 'john@example.com',
  'address': {
    'city': 'Bengaluru',
    'country': 'India'
  },
  'roles': [
    'developer',
    'admin'
  ]
}
```

**Expected error:** JSON strings and property names must use double quotes.

---

## 4. Trailing Commas JSON

```json
{
  "product": {
    "id": "PROD-1001",
    "name": "SmartPay",
    "version": "5.2.1",
    "features": [
      "Payments",
      "Refunds",
      "Settlement",
    ],
  },
  "status": "active",
}
```

**Expected error:** Trailing commas are not allowed in JSON.

---

## 5. Unclosed String JSON

```json
{
  "user": {
    "id": 1001,
    "name": "Rahul Sharma,
    "email": "rahul@example.com",
    "department": "Engineering",
    "skills": [
      "Java",
      "Kotlin",
      "React"
    ]
  }
}
```

**Expected error:** Unclosed string after `"Rahul Sharma`.

---

## 6. Invalid Boolean and Null Values JSON

```json
{
  "user": {
    "id": 1001,
    "name": "Sneha",
    "active": True,
    "verified": FALSE,
    "manager": NULL,
    "settings": {
      "notifications": true,
      "darkMode": false
    }
  }
}
```

**Expected error:** JSON requires lowercase `true`, `false`, and `null`.

---

## 7. Missing Property Value JSON

```json
{
  "id": 1001,
  "name": "David",
  "email": ,
  "phone": "+91-9876543210",
  "address": {
    "city": "Mumbai",
    "country": "India"
  }
}
```

**Expected error:** `"email"` has no value.

---

## 8. Missing Comma Between Properties JSON

```json
{
  "order": {
    "id": "ORD-10001",
    "customer": {
      "id": "CUS-501",
      "name": "Raj Kumar"
    },
    "items": [
      {
        "productId": "P-100",
        "name": "Laptop",
        "quantity": 1,
        "price": 75000
      },
      {
        "productId": "P-101",
        "name": "Mouse",
        "quantity": 2,
        "price": 1500
      }
    ],
    "total": 78000
    "currency": "INR",
    "payment": {
      "method": "CARD",
      "status": "SUCCESS"
    }
  }
}
```

**Expected error:** Missing comma after `"total": 78000`.

---

## 9. Broken Nested JSON

```json
{
  "application": {
    "name": "DeviceManager",
    "version": "12.4.0",
    "environment": "production",
    "database": {
      "host": "db.example.com",
      "port": 5432,
      "credentials": {
        "username": "admin",
        "password": "password123"
      },
    "cache": {
      "enabled": true,
      "host": "redis.example.com",
      "port": 6379
    }
  },
  "features": [
    "device-management",
    "remote-lock",
    "remote-wipe"
  ]
}
```

**Expected error:** Missing closing brace for the `database` object.

---

## 10. Multiple Syntax Errors JSON

```json
{
  "api": {
    "version": "v3",
    "environment": "production",
    "authentication": {
      "type": "OAuth2",
      "enabled": true,
      "providers": [
        "Google",
        "Microsoft",
        "Okta",
      ]
    },
    "endpoints": [
      {
        "method": "GET",
        "path": "/users",
        "rateLimit": 1000,
        "authentication": true
      },
      {
        "method": "POST",
        "path": "/payments",
        "rateLimit": 500,
        "authentication": True
      }
    ],
    "database": {
      "host": "localhost",
      "port": 5432,
      "ssl": true
      "poolSize": 20,
      "timeout": 3000
    }
  },
  "status": "active",
}
```

**Expected errors:**
- Trailing comma in `providers`
- `True` instead of `true`
- Missing comma after `"ssl": true`
- Trailing comma after `"active"`

---

## 11. Severely Broken JSON

```json
{
  "user": {
    "id": 1001,
    "name": "John Doe,
    "email": "john@example.com",
    "active": true,
    "roles": [
      "admin",
      "developer",
    "permissions": {
      "read": true,
      "write": true,
      "delete": false
    }
  },
  "projects": [
    {
      "id": "P001",
      "name": "Payment Gateway",
      "status": "active"
    },
    {
      "id": "P002",
      "name": "Mobile App",
      "status": active
    }
  ],
  "metadata": {
    "createdAt": "2026-08-30T07:30:00Z",
    "updatedAt": ,
    "version": 1.2.3
  }
}
```

**Expected errors:**
- Unclosed string
- Broken `roles` array
- Missing closing delimiters
- Unquoted `active`
- Missing value after `"updatedAt"`
- Invalid number `1.2.3`

---

## 12. Unquoted Property Name JSON

```json
{
  "user": {
    id: 1001,
    name: "Alex",
    "email": "alex@example.com",
    "active": true,
    "department": "Engineering"
  },
  "roles": [
    "developer",
    "reviewer"
  ]
}
```

**Expected error:** Property names must be enclosed in double quotes.

---

## 13. Invalid Number Format JSON

```json
{
  "product": {
    "id": "P-1001",
    "name": "Laptop",
    "price": 75,000,
    "discount": 10.5,
    "tax": 18,
    "quantity": 2
  },
  "total": 135000,
  "currency": "INR"
}
```

**Expected error:** `75,000` is not a valid JSON number.

---

## 14. Unexpected Character JSON

```json
{
  "server": {
    "host": "api.example.com",
    "port": 443,
    "protocol": "https",
    "status": "online"
  },
  @metadata: {
    "region": "ap-south-1",
    "version": "3.4.1"
  }
}
```

**Expected error:** Unexpected `@` character before `metadata`.

---

## 15. Invalid Array Structure JSON

```json
{
  "users": [
    {
      "id": 101,
      "name": "Amit"
    },
    {
      "id": 102,
      "name": "Priya"
    }
    {
      "id": 103,
      "name": "Vikram"
    }
  ],
  "count": 3
}
```

**Expected error:** Missing comma between the second and third array elements.

---

## 16. Incomplete JSON Object

```json
{
  "application": {
    "name": "Payment Gateway",
    "version": "4.8.2",
    "environment": "production",
    "database": {
      "host": "database.internal",
      "port": 5432,
      "ssl": true
    },
    "cache": {
      "host": "redis.internal",
      "port": 6379
    },
    "features": {
      "payments": true,
      "refunds": true,
      "settlement": true
```

**Expected error:** Multiple closing braces are missing.

---

## 17. Incomplete JSON Array

```json
{
  "orders": [
    {
      "id": "ORD-001",
      "amount": 12500,
      "status": "PAID"
    },
    {
      "id": "ORD-002",
      "amount": 8750,
      "status": "PENDING"
    },
    {
      "id": "ORD-003",
      "amount": 19999,
      "status": "PROCESSING"
    }
```

**Expected error:** Missing closing `]` and `}`.

---

## 18. Null/Value Syntax Error JSON

```json
{
  "profile": {
    "id": "USR-1001",
    "name": "Neha Kapoor",
    "age": 32,
    "phone": null,
    "email": "neha@example.com",
    "address": {
      "city": "Pune",
      "state": "Maharashtra",
      "country": "India",
      "postalCode":
    }
  }
}
```

**Expected error:** `"postalCode"` has no value.

---

## 19. Invalid Escape Sequence JSON

```json
{
  "user": {
    "name": "John Doe",
    "message": "Hello\nWorld",
    "path": "C:\Users\John\Documents",
    "quote": "He said \"Hello\"",
    "status": "active"
  }
}
```

**Expected error:** Backslashes in the Windows path create invalid JSON escape sequences.

---

## 20. Mixed Syntax Errors JSON

```json
{
  "system": {
    "name": "Enterprise Platform",
    "version": "10.5.0",
    "enabled": True,
    "servers": [
      {
        "host": "server-01.example.com",
        "port": 8080,
        "healthy": true,
      },
      {
        "host": "server-02.example.com",
        "port": 8081
        "healthy": false
      }
    ],
    "database": {
      host: "db.example.com",
      "port": 5432,
      "username": "admin",
      "password":
    }
  },
  "timestamp": "2026-08-30T08:30:00Z",
}
```

**Expected errors:**
- `True` instead of `true`
- Trailing comma after `"healthy": true`
- Missing comma after `"port": 8081`
- Unquoted `host`
- Missing value after `"password"`
- Trailing comma after `"timestamp"`

---

# Error Categories Covered

| # | Error Type |
|---|---|
| 1 | Missing comma |
| 2 | Missing closing bracket |
| 3 | Single quotes |
| 4 | Trailing comma |
| 5 | Unclosed string |
| 6 | Invalid boolean/null |
| 7 | Missing property value |
| 8 | Missing comma between properties |
| 9 | Broken nested structure |
| 10 | Multiple syntax errors |
| 11 | Severely broken JSON |
| 12 | Unquoted property |
| 13 | Invalid number |
| 14 | Unexpected character |
| 15 | Invalid array structure |
| 16 | Incomplete object |
| 17 | Incomplete array |
| 18 | Missing value |
| 19 | Invalid escape sequence |
| 20 | Mixed syntax errors |

---

## Suggested Test Cases for a JSON Formatter

Your formatter should ideally detect and report:

- Error line number
- Error column number
- Error type
- Unexpected token
- Expected token
- Missing comma
- Missing bracket/brace
- Invalid string
- Invalid number
- Invalid boolean/null
- Invalid escape sequence
- Trailing comma
- Unexpected character
- Multiple syntax errors
- Incomplete JSON
- Empty input
- Whitespace-only input
