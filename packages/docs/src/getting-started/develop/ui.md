```YAML
title: Develop the Web UI in SOMOD
meta:
  description:
    Developing the Web UI is made easy with SOMOD. SOMOD helps to create and reuse NextJS pages in modules.
```

# Develop the Web UI in SOMOD

---

SOMOD supports creating the Web UI using [NextJS](https://nextjs.org/) pages.

NextJs is a complete framework in [ReactJs](https://reactjs.org/) with support for routing, static site generation, server-side rendering, image optimization, ...etc

SOMOD helps to create and reuse NextJS pages in modules.

## Example:-

In the example from the previous chapter, we have created REST APIs for user management. Now let us create the UI pages for these APIs by following the below steps.

1. Choose a Styling library  
   A styling library is a backbone in Web UI development. It defines the look and feel of the whole application. SOMOD works with any styling libraries used with NextJS and React.

   For this example, let us install and configure [Material UI](https://mui.com/)

   ```
   npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
   ```

2. Create the following pages under the `ui` directory

   - `ui/pages/_document.tsx`

     ```typescript
     // ui/pages/_document.tsx

     // This adds Roboto font across all pages
     import { Head, Html, Main, NextScript } from "next/document";

     const Document = () => {
       return (
         <Html>
           <Head>
             <link
               href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;700&family=Roboto:wght@300;400;500;700&display=swap"
               rel="stylesheet"
             />
           </Head>
           <body>
             <Main />
             <NextScript />
           </body>
         </Html>
       );
     };

     export default Document;
     ```

   - `ui/pages/_app.tsx`

     ```typescript
     // ui/pages/_app.tsx

     import { CssBaseline } from "@mui/material";
     import { NextComponentType } from "next";
     import { AppProps } from "next/app";
     import Head from "next/head";
     import { FunctionComponent } from "react";

     const App: FunctionComponent<AppProps & { Component: NextComponentType }> =
       ({ Component, pageProps }) => {
         return (
           <>
             <Head>
               <meta
                 name="viewport"
                 content="initial-scale=1, width=device-width"
               />
             </Head>
             <CssBaseline enableColorScheme />
             <Component {...pageProps} />
           </>
         );
       };

     export default App;
     ```

   - `ui/pages/index.tsx`

     ```typescript
     // ui/pages/index.tsx

     import { Box, Button, Link, Typography } from "@mui/material";
     import { NextComponentType } from "next";
     import NextLink from "next/link";

     const GettingStartedHome: NextComponentType = () => {
       return (
         <Box
           display="flex"
           flexDirection="column"
           alignItems="center"
           justifyContent="center"
           height="100vh"
         >
           <Typography variant="h1">User Management</Typography>
           <Typography variant="h4">
             A Getting Started Project from{" "}
             <Link href="https://somod.dev" target="_blank">
               SOMOD
             </Link>
           </Typography>
           <NextLink href="/user/list" passHref>
             <Button variant="contained" sx={{ m: 2 }}>
               Manage Users
             </Button>
           </NextLink>
         </Box>
       );
     };

     export default GettingStartedHome;
     ```

   - `/ui/pages/user/list.tsx`

     ```typescript
     // /ui/pages/user/list.tsx

     import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
     import EditIcon from "@mui/icons-material/Edit";
     import {
       Box,
       Button,
       Container,
       IconButton,
       Link,
       List,
       ListItem,
       ListItemText,
       Paper,
       Typography
     } from "@mui/material";
     import fetch from "cross-fetch";
     import { NextComponentType } from "next";
     import NextLink from "next/link";
     import { useEffect, useState } from "react";
     import { UserWithId } from "../../../lib/types";

     const deleteUser = async (userId: string) => {
       const response = await fetch(
         process.env.NEXT_PUBLIC_USER_API_URL + "/user/" + userId,
         { method: "DELETE" }
       );
       await response.text();
     };

     const fetchUsers = async () => {
       const response = await fetch(
         process.env.NEXT_PUBLIC_USER_API_URL + "/user/list"
       );

       const users = await response.json();
       return users as UserWithId[];
     };

     const Users: NextComponentType = () => {
       const [users, setUsers] = useState<UserWithId[]>([]);

       useEffect(() => {
         fetchUsers().then(result => {
           setUsers(result);
         });
       }, []);

       const onDeleteUser = (userId: string) => {
         deleteUser(userId).then(() => {
           const newUsers = users.filter(u => u.userId != userId);
           setUsers(newUsers);
         });
       };

       return (
         <Container maxWidth="sm">
           <Box my={3} p={1}>
             <Typography variant="h4">Users</Typography>
             <NextLink href="/user/create" passHref>
               <Button variant="text" sx={{ float: "right" }}>
                 Create New User
               </Button>
             </NextLink>
           </Box>

           <Paper>
             <List>
               {users.map(user => (
                 <ListItem
                   key={user.userId}
                   secondaryAction={
                     <>
                       <NextLink
                         href={"/user/" + user.userId + "/edit"}
                         passHref
                       >
                         <IconButton>
                           <EditIcon />
                         </IconButton>
                       </NextLink>
                       <IconButton
                         onClick={() => {
                           onDeleteUser(user.userId);
                         }}
                       >
                         <DeleteForeverIcon />
                       </IconButton>
                     </>
                   }
                 >
                   <ListItemText
                     primary={
                       <NextLink href={"/user/" + user.userId} passHref>
                         <Link>{user.name}</Link>
                       </NextLink>
                     }
                     secondary={user.email}
                   />
                 </ListItem>
               ))}
             </List>
           </Paper>
         </Container>
       );
     };

     export default Users;
     ```

   - `/ui/pages/user/create.tsx`

     ```typescript
     // /ui/pages/user/create.tsx

     import {
       Box,
       Button,
       Container,
       Paper,
       Stack,
       Switch,
       TextField,
       Typography
     } from "@mui/material";
     import fetch from "cross-fetch";
     import { NextComponentType } from "next";
     import NextLink from "next/link";
     import { useRouter } from "next/router";
     import { useState } from "react";
     import { CreateUserInput, UserWithId } from "../../../lib/types";

     const createUser = async (user: CreateUserInput) => {
       const response = await fetch(
         process.env.NEXT_PUBLIC_USER_API_URL + "/user",
         {
           method: "POST",
           body: JSON.stringify(user),
           headers: { "Content-Type": "application/json" }
         }
       );

       const createdUser = await response.json();
       return createdUser as UserWithId;
     };

     const UserCreate: NextComponentType = () => {
       const [user, setUser] = useState<CreateUserInput>({
         name: "",
         email: "",
         active: true,
         dob: ""
       });

       const router = useRouter();

       const updateName = (name: string) => {
         setUser({ ...user, name });
       };

       const updateEmail = (email: string) => {
         setUser({ ...user, email });
       };

       const updateDob = (dob: string) => {
         setUser({ ...user, dob });
       };

       const updateActive = (active: boolean) => {
         setUser({ ...user, active });
       };

       const submit = () => {
         createUser({
           name: user.name,
           email: user.email,
           dob: user.dob,
           active: user.active
         }).then(result => {
           router.push("/user/" + result.userId);
         });
       };

       return (
         <Container maxWidth="sm">
           <Box my={3} p={1}>
             <Typography variant="h4">Create New User</Typography>

             <Paper sx={{ p: 2 }}>
               <Stack spacing={2}>
                 <Box>
                   <TextField
                     value={user.name}
                     label="Name"
                     fullWidth
                     required
                     onChange={event => {
                       updateName(event.target.value);
                     }}
                   />
                 </Box>
                 <Box>
                   <TextField
                     value={user.email}
                     label="Email"
                     fullWidth
                     required
                     onChange={event => {
                       updateEmail(event.target.value);
                     }}
                   />
                 </Box>
                 <Box>
                   <TextField
                     value={user.dob}
                     label="Date of Birth"
                     fullWidth
                     placeholder="dd/mm/yyyy"
                     InputLabelProps={{ shrink: true }}
                     onChange={event => {
                       updateDob(event.target.value);
                     }}
                   />
                 </Box>
                 <Box>
                   <Typography variant="subtitle2">Active</Typography>
                   <Switch
                     checked={user.active}
                     size="small"
                     onChange={event => {
                       updateActive(event.target.checked);
                     }}
                   />
                 </Box>

                 <Button variant="contained" onClick={submit}>
                   Create
                 </Button>
                 <NextLink href={"/user/list"} passHref>
                   <Button variant="text" color="info">
                     Back to User List
                   </Button>
                 </NextLink>
               </Stack>
             </Paper>
           </Box>
         </Container>
       );
     };

     export default UserCreate;
     ```

   - `/ui/pages/user/[userId].tsx`

     ```typescript
     // /ui/pages/user/[userId].tsx

     import {
       Box,
       Button,
       Container,
       Paper,
       Skeleton,
       Stack,
       Switch,
       Typography
     } from "@mui/material";
     import fetch from "cross-fetch";
     import { NextComponentType } from "next";
     import NextLink from "next/link";
     import { useRouter } from "next/router";
     import { useEffect, useState } from "react";
     import { UserWithId } from "../../../lib/types";

     const fetchUser = async (userId: string) => {
       const response = await fetch(
         process.env.NEXT_PUBLIC_USER_API_URL + "/user/" + userId
       );

       const users = await response.json();
       return users as UserWithId;
     };

     const UserView: NextComponentType = () => {
       const [user, setUser] = useState<UserWithId>();

       const router = useRouter();

       const { userId } = router.query;

       useEffect(() => {
         if (userId) {
           fetchUser(userId as string).then(result => {
             setUser(result);
           });
         }
       }, [userId]);

       return (
         <Container maxWidth="sm">
           <Box my={3} p={1}>
             <Typography variant="h4">User</Typography>

             <Paper sx={{ p: 2 }}>
               <Stack spacing={2}>
                 {user ? (
                   <>
                     <Box>
                       <Typography variant="caption">{user.userId}</Typography>
                     </Box>
                     <Box>
                       <Typography variant="subtitle2">Name</Typography>
                       <Typography variant="body2">{user.name}</Typography>
                     </Box>
                     <Box>
                       <Typography variant="subtitle2">Email</Typography>
                       <Typography variant="body2">{user.email}</Typography>
                     </Box>
                     <Box>
                       <Typography variant="subtitle2">
                         Date of Birth
                       </Typography>
                       <Typography variant="body2">{user.dob}</Typography>
                     </Box>
                     <Box>
                       <Typography variant="subtitle2">Active</Typography>
                       <Switch readOnly checked={user.active} size="small" />
                     </Box>

                     <Box>
                       <Typography variant="subtitle2">
                         Last Updated At
                       </Typography>
                       <Typography variant="body2">
                         {new Date(user.lastUpdatedAt).toDateString()}
                       </Typography>
                     </Box>

                     <Box>
                       <Typography variant="subtitle2">Created At</Typography>
                       <Typography variant="body2">
                         {new Date(user.createdAt).toDateString()}
                       </Typography>
                     </Box>
                     <NextLink href={"/user/" + user.userId + "/edit"} passHref>
                       <Button variant="outlined">Edit</Button>
                     </NextLink>
                     <NextLink href={"/user/list"} passHref>
                       <Button variant="text" color="info">
                         Back to User List
                       </Button>
                     </NextLink>
                   </>
                 ) : (
                   <>
                     <Skeleton variant="rounded" height={20} />
                     <Skeleton variant="rounded" height={60} />
                     <Skeleton variant="rounded" height={60} />
                   </>
                 )}
               </Stack>
             </Paper>
           </Box>
         </Container>
       );
     };

     export default UserView;
     ```

   - `/ui/pages/user/[userId]/edit.tsx`

     ```typescript
     // /ui/pages/user/[userId]/edit.tsx

     import {
       Box,
       Button,
       Container,
       Paper,
       Skeleton,
       Stack,
       Switch,
       TextField,
       Typography
     } from "@mui/material";
     import fetch from "cross-fetch";
     import { NextComponentType } from "next";
     import NextLink from "next/link";
     import { useRouter } from "next/router";
     import { useEffect, useState } from "react";
     import { UpdateUserInput, UserWithId } from "../../../../lib/types";

     const fetchUser = async (userId: string) => {
       const response = await fetch(
         process.env.NEXT_PUBLIC_USER_API_URL + "/user/" + userId
       );

       const user = await response.json();
       return user as UserWithId;
     };

     const updateUser = async (userId: string, user: UpdateUserInput) => {
       const response = await fetch(
         process.env.NEXT_PUBLIC_USER_API_URL + "/user/" + userId,
         {
           method: "PUT",
           body: JSON.stringify(user),
           headers: { "Content-Type": "application/json" }
         }
       );

       const updatedUser = await response.json();
       return updatedUser as UserWithId;
     };

     const UserEdit: NextComponentType = () => {
       const [user, setUser] = useState<UserWithId>();

       const router = useRouter();

       const { userId } = router.query;

       useEffect(() => {
         if (userId) {
           fetchUser(userId as string).then(result => {
             setUser(result);
           });
         }
       }, [userId]);

       const updateName = (name: string) => {
         setUser({ ...user, name });
       };

       const updateEmail = (email: string) => {
         setUser({ ...user, email });
       };

       const updateDob = (dob: string) => {
         setUser({ ...user, dob });
       };

       const updateActive = (active: boolean) => {
         setUser({ ...user, active });
       };

       const submit = () => {
         updateUser(user.userId, {
           name: user.name,
           email: user.email,
           dob: user.dob,
           active: user.active
         }).then(() => {
           router.push("/user/" + user.userId);
         });
       };

       return (
         <Container maxWidth="sm">
           <Box my={3} p={1}>
             <Typography variant="h4">Edit User</Typography>

             <Paper sx={{ p: 2 }}>
               <Stack spacing={2}>
                 {user ? (
                   <>
                     <Box>
                       <Typography variant="caption">{user.userId}</Typography>
                     </Box>
                     <Box>
                       <TextField
                         value={user.name}
                         label="Name"
                         fullWidth
                         required
                         onChange={event => {
                           updateName(event.target.value);
                         }}
                       />
                     </Box>
                     <Box>
                       <TextField
                         value={user.email}
                         label="Email"
                         fullWidth
                         required
                         onChange={event => {
                           updateEmail(event.target.value);
                         }}
                       />
                     </Box>
                     <Box>
                       <TextField
                         value={user.dob}
                         label="Date of Birth"
                         fullWidth
                         placeholder="dd/mm/yyyy"
                         InputLabelProps={{ shrink: true }}
                         onChange={event => {
                           updateDob(event.target.value);
                         }}
                       />
                     </Box>
                     <Box>
                       <Typography variant="subtitle2">Active</Typography>
                       <Switch
                         checked={user.active}
                         size="small"
                         onChange={event => {
                           updateActive(event.target.checked);
                         }}
                       />
                     </Box>

                     <Button variant="contained" onClick={submit}>
                       Submit
                     </Button>
                     <NextLink href={"/user/" + user.userId} passHref>
                       <Button variant="outlined" color="secondary">
                         Cancel
                       </Button>
                     </NextLink>
                   </>
                 ) : (
                   <>
                     <Skeleton variant="rounded" height={20} />
                     <Skeleton variant="rounded" height={60} />
                     <Skeleton variant="rounded" height={60} />
                   </>
                 )}
               </Stack>
             </Paper>
           </Box>
         </Container>
       );
     };

     export default UserEdit;
     ```

3. Start a dev server for the UI

   ```
   npx somod serve --dev -v
   ```

   Open the URL `http://localhost:3000` in the browser to see the User Management App

Now the Module is ready with Backend and Frontend Code working together. In the [Next Chapter](/getting-started/build), let us understand how to build and ship the SOMOD module.
