<div id="paypal-button-container-P-9GS052867F819673SNHE7HGA"></div>
<script src="https://www.paypal.com/sdk/js?client-id=AaSErHTOupYcpHPM5KAOrEtSWdNC8Rj_sbR3KvlaFBjjysSfif5mqJNCS6K6Ohe9xGlirbhuN8p2tNfy&vault=true&intent=subscription" data-sdk-integration-source="button-factory"></script>
<script>
  paypal.Buttons({
      style: {
          shape: 'pill',
          color: 'silver',
          layout: 'vertical',
          label: 'paypal'
      },
      createSubscription: function(data, actions) {
        return actions.subscription.create({
          /* Creates the subscription */
          plan_id: 'P-9GS052867F819673SNHE7HGA'
        });
      },
      onApprove: function(data, actions) {
        alert(data.subscriptionID); // You can add optional success message for the subscriber here
      }
  }).render('#paypal-button-container-P-9GS052867F819673SNHE7HGA'); // Renders the PayPal button
</script>
