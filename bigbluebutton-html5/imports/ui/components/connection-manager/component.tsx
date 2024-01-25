import {
  ApolloClient, ApolloProvider, InMemoryCache, NormalizedCacheObject,
} from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import React, { useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import LoadingScreen from '/imports/ui/components/common/loading-screen/component';

interface Props {
  children: React.ReactNode;
}

interface Response {
  response: {
  returncode: string;
  version: string;
  apiVersion: string;
  bbbVersion: string;
  graphqlWebsocketUrl: string;
  }
}

const ConnectionManager = ({ children }: Props): React.ReactNode => {
  const [graphqlUrlapolloClient, setApolloClient] = React.useState<ApolloClient<NormalizedCacheObject> | null>(null);
  const [graphqlUrl, setGraphqlUrl] = React.useState<string>('');
  useEffect(() => {
    fetch(`https://${window.location.hostname}/bigbluebutton/api`, {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (response) => {
      const responseJson: Response = await response.json();
      setGraphqlUrl(responseJson.response.graphqlWebsocketUrl);
    }).catch((error) => {
      throw new Error('Error fetching GraphQL URL: '.concat(error.message || ''));
    });
  }, []);

  useEffect(() => {
    if (graphqlUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionToken = urlParams.get('sessionToken');
      if (!sessionToken) {
        throw new Error('Missing session token');
      }
      let wsLink;
      try {
        wsLink = new WebSocketLink(
          new SubscriptionClient(graphqlUrl, {
            reconnect: true,
            timeout: 30000,
            connectionParams: {
              headers: {
                'X-Session-Token': sessionToken,
              },
            },
          }),
        );
      } catch (error) {
        throw new Error('Error creating WebSocketLink: '.concat(JSON.stringify(error) || ''));
      }
      let client;
      try {
        client = new ApolloClient({
          link: wsLink,
          cache: new InMemoryCache(),
          connectToDevTools: Meteor.isDevelopment,
        });
        setApolloClient(client);
      } catch (error) {
        throw new Error('Error creating Apollo Client: '.concat(JSON.stringify(error) || ''));
      }
    }
  },
  [graphqlUrl]);
  return (
    graphqlUrlapolloClient
      ? (
        <ApolloProvider
          client={graphqlUrlapolloClient}
        >
          {children}
        </ApolloProvider>
      ) : (
        <LoadingScreen>
          {/* I made this because the component is in JS and requires a child, but it's optional */}
          <div style={{
            display: 'none',
          }}
          >
            <h1>Loading...</h1>
          </div>
        </LoadingScreen>
      )
  );
};

export default ConnectionManager;
