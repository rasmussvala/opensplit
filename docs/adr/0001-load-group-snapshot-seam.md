---
status: accepted
---

# Load group data through an application seam

Group pages currently know how to query Supabase, interpret membership, and map database rows. We introduce `LoadGroupSnapshot` as the application module for loading a group, its members, expenses, and settlements, with `GroupDataSource` as its data-source seam and Supabase as a concrete adapter. This keeps persistence names and query coordination out of React pages while allowing an in-memory adapter to test the application behavior. We considered keeping queries in each page and introducing a generic database service, but chose the cohesive group-loading operation because it provides more depth and better locality without exposing a broad pass-through interface.

The initial change defines the seam and adapters and migrates `GroupPage` plus its group-view presentation components. Other pages remain on their existing data-access paths and will be migrated incrementally.
